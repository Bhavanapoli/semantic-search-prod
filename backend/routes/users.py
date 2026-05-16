from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from auth.jwt_handler import get_current_user, require_admin
from database.mongodb import get_db
from models.schemas import UserUpdate

router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "created_at": user["created_at"],
        "search_count": user.get("search_count", 0),
        "upload_count": user.get("upload_count", 0),
    }


@router.patch("/profile")
async def update_profile(payload: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": update})
    return {"message": "Profile updated"}


@router.get("/papers")
async def my_papers(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.papers.find(
        {"uploaded_by": current_user["sub"]},
        {"title": 1, "authors": 1, "summary": 1, "uploaded_at": 1},
    ).sort("uploaded_at", -1)
    papers = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        papers.append(doc)
    return {"papers": papers}


# Admin only
@router.get("/all")
async def list_all_users(_admin: dict = Depends(require_admin)):
    db = get_db()
    cursor = db.users.find({}, {"hashed_password": 0}).sort("created_at", -1).limit(100)
    users = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        users.append(doc)
    return {"users": users}
