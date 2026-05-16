from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from auth.jwt_handler import get_current_user, require_admin
from database.mongodb import get_db

router = APIRouter()


@router.get("/summary")
async def analytics_summary(_admin: dict = Depends(require_admin)):
    db = get_db()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_users   = await db.users.count_documents({})
    total_papers  = await db.papers.count_documents({})
    total_queries = await db.queries.count_documents({})
    queries_today = await db.queries.count_documents({"timestamp": {"$gte": today}})

    # Top 10 queries
    pipeline = [
        {"$group": {"_id": "$query", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
        {"$project": {"query": "$_id", "count": 1, "_id": 0}},
    ]
    top_queries = [doc async for doc in db.queries.aggregate(pipeline)]

    # Recent uploads
    cursor = db.uploads.find({}, {"filename": 1, "status": 1, "uploaded_at": 1}).sort("uploaded_at", -1).limit(10)
    recent_uploads = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        recent_uploads.append(doc)

    return {
        "total_users": total_users,
        "total_papers": total_papers,
        "total_queries": total_queries,
        "queries_today": queries_today,
        "top_queries": top_queries,
        "recent_uploads": recent_uploads,
    }


@router.get("/query-trend")
async def query_trend(days: int = 7, _admin: dict = Depends(require_admin)):
    db = get_db()
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {
            "$group": {
                "_id": {
                    "year":  {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day":   {"$dayOfMonth": "$timestamp"},
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    trend = [
        {
            "date": f"{d['_id']['year']}-{d['_id']['month']:02d}-{d['_id']['day']:02d}",
            "queries": d["count"],
        }
        async for d in db.queries.aggregate(pipeline)
    ]
    return {"trend": trend}


@router.get("/users/stats")
async def user_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    recent_queries_cursor = db.queries.find(
        {"user_id": current_user["sub"]},
        {"query": 1, "timestamp": 1, "result_count": 1},
    ).sort("timestamp", -1).limit(5)
    recent_queries = []
    async for q in recent_queries_cursor:
        q["id"] = str(q.pop("_id"))
        recent_queries.append(q)

    return {
        "search_count": user.get("search_count", 0),
        "upload_count": user.get("upload_count", 0),
        "member_since": user.get("created_at"),
        "recent_queries": recent_queries,
    }
