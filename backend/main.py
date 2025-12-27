import re
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from passlib.context import CryptContext
from bson import ObjectId

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
            elif isinstance(v, dict):
                fix_id(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        fix_id(item)
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
    team_id: Optional[str] = None 

class Login(BaseModel):
    email: EmailStr
    password: str

class WorkCenter(BaseModel):
    name: str
    code: str
    tag: Optional[str] = None
    cost_per_hour: float = 0.0
    capacity: float = 1.0
    time_efficiency: float = 100.0
    oee_target: float = 90.0

class EquipmentCategory(BaseModel):
    name: str

class MaintenanceTeam(BaseModel):
    name: str
    category_ids: List[str] = []

class MemberAssignment(BaseModel):
    user_id: str

class Equipment(BaseModel):
    name: str
    serial_number: str
    category: Optional[str] = None 
    category_id: str 
    company: str = "My Company (SF)"
    used_by: Optional[str] = None
    department: Optional[str] = "Admin"
    technician_name: Optional[str] = None 
    maintenance_team: Optional[str] = None 
    maintenance_team_id: str 
    status: str = "Active"
    location: Optional[str] = None
    description: Optional[str] = None

class Request(BaseModel):
    subject: str
    created_by_name: str
    created_by_id: str
    # Both are optional now, but logic will ensure at least one is present
    equipment_id: Optional[str] = None
    equipment_name: Optional[str] = None 
    work_center_id: Optional[str] = None 
    work_center_name: Optional[str] = None
    
    category: Optional[str] = None 
    maintenance_team: Optional[str] = None 
    maintenance_team_id: Optional[str] = None 
    
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
    if await db.users.find_one({"email": user.email}): raise HTTPException(400, "Email exists")
    pwd = user.password
    if len(pwd) <= 8: raise HTTPException(400, "Password > 8 chars required")
    if not re.search(r"[a-z]", pwd) or not re.search(r"[A-Z]", pwd) or not re.search(r"[\W_]", pwd):
        raise HTTPException(400, "Password complexity not met")
    u = user.dict()
    u["password"] = get_hash(u["password"])
    res = await db.users.insert_one(u)
    return {"id": str(res.inserted_id), "role": u["role"]}

@app.post("/auth/login")
async def login(creds: Login):
    u = await db.users.find_one({"email": creds.email})
    if not u or not verify_password(creds.password, u["password"]): raise HTTPException(401, "Invalid Credentials")
    return {"user": {"id": str(u["_id"]), "name": u["name"], "role": u.get("role", "user"), "team_id": u.get("team_id")}}

@app.get("/auth/me")
async def get_current_user_profile(user_id: str):
    if not ObjectId.is_valid(user_id): raise HTTPException(400, "Invalid ID")
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u: raise HTTPException(404, "User not found")
    return {"id": str(u["_id"]), "name": u["name"], "role": u.get("role", "user"), "team_id": u.get("team_id")}

@app.get("/users")
async def list_users(role: Optional[str] = None):
    query = {}
    if role: query["role"] = role
    return [fix_id(u) for u in await db.users.find(query, {"password": 0}).to_list(100)]

# --- WORK CENTERS ---
@app.post("/work-centers")
async def create_work_center(wc: WorkCenter):
    res = await db.workcenters.insert_one(wc.dict())
    return {"id": str(res.inserted_id)}

@app.get("/work-centers")
async def list_work_centers():
    return [fix_id(d) for d in await db.workcenters.find({}).to_list(100)]

# --- TEAMS/CATEGORIES ---
@app.post("/categories")
async def create_category(cat: EquipmentCategory):
    res = await db.categories.insert_one(cat.dict())
    return {"id": str(res.inserted_id), "name": cat.name}

@app.get("/categories")
async def list_categories():
    return [fix_id(d) for d in await db.categories.find({}).to_list(100)]

@app.post("/teams")
async def create_team(team: MaintenanceTeam):
    res = await db.teams.insert_one(team.dict())
    return {"id": str(res.inserted_id), "name": team.name}

@app.get("/teams")
async def list_teams():
    pipeline = [
        {"$addFields": {"teamIdStr": {"$toString": "$_id"}}},
        {"$lookup": {"from": "users", "localField": "teamIdStr", "foreignField": "team_id", "as": "members"}},
        {"$lookup": {"from": "categories", "localField": "category_ids", "foreignField": "_id", "as": "responsible_categories"}}
    ]
    cursor = db.teams.aggregate(pipeline)
    teams = await cursor.to_list(100)
    return [fix_id(t) for t in teams]

@app.post("/teams/{team_id}/assign")
async def assign_team_member(team_id: str, payload: MemberAssignment):
    if not ObjectId.is_valid(team_id): raise HTTPException(400, "Invalid Team ID")
    res = await db.users.update_one({"_id": ObjectId(payload.user_id)}, {"$set": {"team_id": team_id}})
    if res.modified_count == 0: raise HTTPException(400, "User not found")
    return {"status": "assigned"}

# --- EQUIPMENT ---
@app.get("/equipment")
async def list_equipment(): return [fix_id(d) for d in await db.equipment.find({}).to_list(100)]

@app.post("/equipment")
async def create_equipment(eq: Equipment):
    if ObjectId.is_valid(eq.category_id):
        cat = await db.categories.find_one({"_id": ObjectId(eq.category_id)})
        if cat: eq.category = cat["name"]
    if ObjectId.is_valid(eq.maintenance_team_id):
        team = await db.teams.find_one({"_id": ObjectId(eq.maintenance_team_id)})
        if team: eq.maintenance_team = team["name"]
    res = await db.equipment.insert_one(eq.dict())
    return {"id": str(res.inserted_id)}

@app.delete("/equipment/{id}")
async def delete_equipment(id: str):
    await db.equipment.delete_one({"_id": ObjectId(id)})
    await db.requests.delete_many({"equipment_id": id})
    return {"status": "deleted"}

@app.get("/equipment/{id}")
async def get_eq(id: str):
    doc = await db.equipment.find_one({"_id": ObjectId(id)})
    data = fix_id(doc) if doc else {}
    if data: data["request_count"] = await db.requests.count_documents({"equipment_id": id})
    return data

# --- REQUESTS ---
@app.get("/requests")
async def list_requests():
    pipeline = [
        {"$addFields": {"eqId": {"$toObjectId": "$equipment_id"}, "wcId": {"$toObjectId": "$work_center_id"}}},
        {"$lookup": {"from": "equipment", "localField": "eqId", "foreignField": "_id", "as": "eq"}},
        {"$unwind": {"path": "$eq", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "workcenters", "localField": "wcId", "foreignField": "_id", "as": "wc"}},
        {"$unwind": {"path": "$wc", "preserveNullAndEmptyArrays": True}}
    ]
    cursor = db.requests.aggregate(pipeline)
    res = []
    for doc in await cursor.to_list(100):
        d = fix_id(doc)
        eq_data = d.pop("eq", {})
        wc_data = d.pop("wc", {})
        d["equipment_name"] = eq_data.get("name", None)
        d["work_center_name"] = wc_data.get("name", None)
        # Fallback for list display
        d["target_name"] = d["equipment_name"] or d["work_center_name"] or "Unknown"
        d.pop("eqId", None)
        d.pop("wcId", None)
        res.append(d)
    return res

@app.post("/requests")
async def create_request(req: Request):
    # Logic for Equipment
    if req.equipment_id and ObjectId.is_valid(req.equipment_id):
        eq = await db.equipment.find_one({"_id": ObjectId(req.equipment_id)})
        if eq:
            req.category = eq.get("category")
            req.maintenance_team = eq.get("maintenance_team")
            req.maintenance_team_id = eq.get("maintenance_team_id")
            req.work_center_id = None # Ensure mutual exclusivity
    
    # Logic for Work Center
    elif req.work_center_id and ObjectId.is_valid(req.work_center_id):
        wc = await db.workcenters.find_one({"_id": ObjectId(req.work_center_id)})
        if wc: 
            req.work_center_name = wc["name"]
            req.equipment_id = None # Ensure mutual exclusivity
    else:
        raise HTTPException(400, "Must select either Equipment or Work Center")

    res = await db.requests.insert_one(req.dict())
    return {"id": str(res.inserted_id)}

@app.get("/requests/{id}")
async def get_request(id: str):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    req = await db.requests.find_one({"_id": ObjectId(id)})
    if not req: raise HTTPException(404, "Not Found")
    data = fix_id(req)
    
    if data.get("equipment_id") and ObjectId.is_valid(data["equipment_id"]):
        eq = await db.equipment.find_one({"_id": ObjectId(data["equipment_id"])})
        data["equipment_name"] = eq["name"] if eq else None
    
    if data.get("work_center_id") and ObjectId.is_valid(data["work_center_id"]):
        wc = await db.workcenters.find_one({"_id": ObjectId(data["work_center_id"])})
        data["work_center_name"] = wc["name"] if wc else None
        
    return data

@app.put("/requests/{id}")
async def update_request(id: str, update: dict = Body(...)):
    if not ObjectId.is_valid(id): raise HTTPException(400, "Invalid ID")
    if update.get("stage") == "Scrap" and update.get("equipment_id"):
        # Only set Equipment to scrapped, not Work Center
        req = await db.requests.find_one({"_id": ObjectId(id)})
        if req and req.get("equipment_id"):
            await db.equipment.update_one({"_id": ObjectId(req["equipment_id"])}, {"$set": {"status": "Scrapped"}})
            
    await db.requests.update_one({"_id": ObjectId(id)}, {"$set": update})
    return {"status": "updated"}

@app.delete("/requests/{id}")
async def delete_request(id: str):
    await db.requests.delete_one({"_id": ObjectId(id)})
    return {"status": "deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)