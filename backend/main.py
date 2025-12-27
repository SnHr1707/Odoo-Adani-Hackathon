import re
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from passlib.context import CryptContext
from bson import ObjectId

# --- CONFIG ---
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "gearguard_db"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# --- HELPERS ---
def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                doc[k] = str(v)
    return doc

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_hash(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

# --- MODELS ---
class User(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user" 

class Login(BaseModel):
    email: EmailStr
    password: str

class Equipment(BaseModel):
    name: str
    serial_number: str
    category: str
    company: str = "My Company (SF)"
    used_by: Optional[str] = None
    department: Optional[str] = "Admin"
    technician_name: Optional[str] = None
    maintenance_team: str = "Internal Maintenance"
    status: str = "Active"
    location: Optional[str] = None

class Request(BaseModel):
    subject: str
    created_by_name: str
    created_by_id: str
    equipment_id: str
    category: str
    maintenance_team: str
    request_date: str
    type: str
    priority: int = 1
    technician_name: Optional[str] = None
    technician_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    duration: float = 0.0
    stage: str = "New"
    notes: Optional[str] = ""

# --- AUTH ROUTES ---

@app.post("/auth/signup")
async def signup(user: User):
    # 1. Check Duplicate Email
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(400, "Email already exists")
    
    # 2. STRICT Password Validation
    pwd = user.password
    if len(pwd) <= 8:
        raise HTTPException(400, "Password must be more than 8 characters.")
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(400, "Password must contain a lowercase letter.")
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(400, "Password must contain an uppercase letter.")
    if not re.search(r"[\W_]", pwd):
        raise HTTPException(400, "Password must contain a special character (@, #, $, etc).")

    u = user.dict()
    u["password"] = get_hash(u["password"])
    res = await db.users.insert_one(u)
    return {"id": str(res.inserted_id), "role": u["role"]}

@app.post("/auth/login")
async def login(creds: Login):
    u = await db.users.find_one({"email": creds.email})
    if not u:
        raise HTTPException(404, "Account does not exist")
    if not verify_password(creds.password, u["password"]):
        raise HTTPException(401, "Invalid Password")
        
    return {"user": {"id": str(u["_id"]), "name": u["name"], "role": u.get("role", "user")}}

# --- EQUIPMENT ROUTES ---

@app.get("/equipment")
async def list_equipment():
    cursor = db.equipment.find({})
    return [fix_id(d) for d in await cursor.to_list(100)]

@app.post("/equipment")
async def create_equipment(eq: Equipment):
    res = await db.equipment.insert_one(eq.dict())
    return {"id": str(res.inserted_id)}

@app.get("/equipment/{id}")
async def get_eq(id: str):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    doc = await db.equipment.find_one({"_id": ObjectId(id)})
    if not doc: raise HTTPException(404)
    data = fix_id(doc)
    data["request_count"] = await db.requests.count_documents({"equipment_id": id})
    return data

@app.delete("/equipment/{id}")
async def delete_equipment(id: str):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    res = await db.equipment.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0: raise HTTPException(404, "Equipment not found")
    # Optional: Delete associated requests?
    await db.requests.delete_many({"equipment_id": id})
    return {"status": "deleted"}

# --- REQUEST ROUTES ---

@app.get("/requests")
async def list_requests():
    pipeline = [
        {"$addFields": {"eqId": {"$toObjectId": "$equipment_id"}}},
        {"$lookup": {"from": "equipment", "localField": "eqId", "foreignField": "_id", "as": "eq"}},
        {"$unwind": {"path": "$eq", "preserveNullAndEmptyArrays": True}} 
    ]
    cursor = db.requests.aggregate(pipeline)
    res = []
    for doc in await cursor.to_list(100):
        d = fix_id(doc)
        eq_data = d.pop("eq", {})
        d["equipment_name"] = eq_data.get("name", "Unknown/Deleted")
        d.pop("eqId", None)
        res.append(d)
    return res

@app.post("/requests")
async def create_request(req: Request):
    res = await db.requests.insert_one(req.dict())
    return {"id": str(res.inserted_id)}

@app.get("/requests/{id}")
async def get_request(id: str):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    req = await db.requests.find_one({"_id": ObjectId(id)})
    if not req: raise HTTPException(404)
    data = fix_id(req)
    if ObjectId.is_valid(req.get("equipment_id")):
        eq = await db.equipment.find_one({"_id": ObjectId(req["equipment_id"])})
        data["equipment_name"] = eq["name"] if eq else "Unknown"
    return data

@app.put("/requests/{id}")
async def update_request(id: str, update: dict = Body(...)):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    if update.get("stage") == "Scrap":
        req = await db.requests.find_one({"_id": ObjectId(id)})
        if req:
            await db.equipment.update_one(
                {"_id": ObjectId(req["equipment_id"])},
                {"$set": {"status": "Scrapped", "scrap_date": datetime.now().strftime("%Y-%m-%d")}}
            )
    await db.requests.update_one({"_id": ObjectId(id)}, {"$set": update})
    return {"status": "updated"}

@app.delete("/requests/{id}")
async def delete_request(id: str):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    await db.requests.delete_one({"_id": ObjectId(id)})
    return {"status": "deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)