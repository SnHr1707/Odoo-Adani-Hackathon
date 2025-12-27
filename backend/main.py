from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
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
        # Convert _id to string id
        doc["id"] = str(doc.pop("_id"))
        # Recursively fix nested ObjectIds just in case
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
    scrap_date: Optional[str] = None # Added field
    work_center: Optional[str] = None # Added field
    description: Optional[str] = None # Added field
    assigned_date: Optional[str] = None # Added field

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

# --- ROUTES ---

@app.post("/auth/signup")
async def signup(user: User):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(400, "Email exists")
    u = user.dict()
    u["password"] = get_hash(u["password"])
    res = await db.users.insert_one(u)
    return {"id": str(res.inserted_id), "role": u["role"]}

@app.post("/auth/login")
async def login(creds: Login):
    u = await db.users.find_one({"email": creds.email})
    if not u or not verify_password(creds.password, u["password"]):
        raise HTTPException(401, "Invalid credentials")
    return {"user": {"id": str(u["_id"]), "name": u["name"], "role": u.get("role", "user")}}

# EQUIPMENT
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

# REQUESTS
@app.get("/requests")
async def list_requests():
    pipeline = [
        # Convert string equipment_id to ObjectId for lookup
        {"$addFields": {"eqId": {"$toObjectId": "$equipment_id"}}},
        {"$lookup": {
            "from": "equipment",
            "localField": "eqId",
            "foreignField": "_id",
            "as": "eq"
        }},
        {"$unwind": {"path": "$eq", "preserveNullAndEmptyArrays": True}} 
    ]
    cursor = db.requests.aggregate(pipeline)
    res = []
    for doc in await cursor.to_list(100):
        d = fix_id(doc) # Fixes root _id
        
        # FIX: Extract name and REMOVE the 'eq' object which contains ObjectId
        eq_data = d.pop("eq", {}) 
        d["equipment_name"] = eq_data.get("name", "Unknown/Deleted")
        
        # Cleanup temporary field
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
    
    # Fetch equipment name separately
    if ObjectId.is_valid(req.get("equipment_id")):
        eq = await db.equipment.find_one({"_id": ObjectId(req["equipment_id"])})
        data["equipment_name"] = eq["name"] if eq else "Unknown"
    else:
        data["equipment_name"] = "Unknown"
        
    return data

@app.put("/requests/{id}")
async def update_request(id: str, update: dict = Body(...)):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    
    # Scrap Logic
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
    result = await db.requests.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 1:
        return {"status": "deleted"}
    raise HTTPException(404, "Request not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)