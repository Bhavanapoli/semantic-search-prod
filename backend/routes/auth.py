from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from database.mongodb import get_db
from auth.jwt_handler import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, get_current_user,
)
from models.schemas import UserCreate, UserLogin, TokenResponse, RefreshRequest, UserOut
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


def _serialize_user(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        username=doc["username"],
        email=doc["email"],
        role=doc.get("role", "user"),
        created_at=doc["created_at"],
        search_count=doc.get("search_count", 0),
        upload_count=doc.get("upload_count", 0),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "search_count": 0,
        "upload_count": 0,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    user_id = str(result.inserted_id)
    logger.info(f"New user registered: {payload.email}")
    return TokenResponse(
        access_token=create_access_token(user_id, payload.email),
        refresh_token=create_refresh_token(user_id),
        user=_serialize_user(doc),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])
    logger.info(f"User logged in: {payload.email}")
    return TokenResponse(
        access_token=create_access_token(user_id, user["email"], user.get("role", "user")),
        refresh_token=create_refresh_token(user_id),
        user=_serialize_user(user),
    )


@router.post("/refresh", response_model=dict)
async def refresh_token(payload: RefreshRequest):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(data["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_id = str(user["_id"])
    return {
        "access_token": create_access_token(user_id, user["email"], user.get("role", "user")),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(user)


@router.post("/logout")
async def logout():
    # Stateless JWT — client just discards tokens
    return {"message": "Logged out successfully"}
