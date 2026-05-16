from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from auth.jwt_handler import get_current_user
from database.mongodb import get_db
from models.schemas import SearchResponse
from utils.logger import get_logger

# Import existing pipeline
from utils.query import build_answer, unified_search

router = APIRouter()
logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)


def _get_faiss():
    from app import get_faiss_state
    return get_faiss_state()


@router.post("", response_model=SearchResponse)
@limiter.limit("30/minute")
async def semantic_search(
    request: Request,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    query = body.get("query", "").strip()
    scope = body.get("scope", "all")
    target_title = body.get("target_title") or body.get("title")
    if not query or len(query) < 3:
        raise HTTPException(status_code=400, detail="Query too short")

    faiss_state = _get_faiss()
    metadata = faiss_state.get("metadata") or []
    section_meta = faiss_state.get("section_meta") or []
    if not faiss_state.get("global_idx") and not metadata and not section_meta:
        raise HTTPException(status_code=503, detail="Search index not ready. Please upload papers first.")

    sections_raw, papers_raw = unified_search(
        query,
        faiss_state.get("global_idx"),
        metadata,
        faiss_state.get("section_idx"),
        section_meta,
        user_id=current_user["sub"] if scope == "my" else None,
        target_title=target_title,
    )
    answer = build_answer(query, sections_raw, papers_raw)

    db = get_db()

    # Log query to MongoDB
    query_doc = {
        "user_id": current_user["sub"],
        "query": query,
        "timestamp": datetime.now(timezone.utc),
        "result_count": len(papers_raw),
        "sections_found": len(sections_raw),
    }
    insert_result = await db.queries.insert_one(query_doc)
    await db.users.update_one(
        {"_id": __import__("bson").ObjectId(current_user["sub"])},
        {"$inc": {"search_count": 1}},
    )

    return SearchResponse(
        query=query,
        answer=answer,
        sections=sections_raw,
        papers=papers_raw,
        result_count=len(papers_raw) + len(sections_raw),
        query_id=str(insert_result.inserted_id),
    )


@router.get("/history")
async def search_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    cursor = db.queries.find(
        {"user_id": current_user["sub"]},
        {"_id": 1, "query": 1, "timestamp": 1, "result_count": 1},
    ).sort("timestamp", -1).limit(limit)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        history.append(doc)
    return {"history": history}


@router.get("/suggestions")
async def query_suggestions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    pipeline = [
        {"$group": {"_id": "$query", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    cursor = db.queries.aggregate(pipeline)
    suggestions = [doc["_id"] async for doc in cursor]
    return {"suggestions": suggestions}
