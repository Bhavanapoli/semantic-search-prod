import os
import shutil
import tempfile
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from auth.jwt_handler import get_current_user
from database.mongodb import get_db
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

FAISS_PATHS = {
    "global_idx": os.path.join(BASE_DIR, "tmp", "faiss_global.idx"),
    "meta_pkl":   os.path.join(BASE_DIR, "tmp", "faiss_metadata.pkl"),
    "sec_idx":    os.path.join(BASE_DIR, "tmp", "faiss_sections.idx"),
    "sec_meta":   os.path.join(BASE_DIR, "tmp", "faiss_section_meta.pkl"),
}


async def _process_pdf_background(upload_id: str, tmp_path: str, title: str, user_id: str):
    db = get_db()
    try:
        await db.uploads.update_one(
            {"_id": __import__("bson").ObjectId(upload_id)},
            {"$set": {"status": "processing"}},
        )

        from utils.pdfExt import process_pdf
        from utils.summarize import add_summaries
        from utils.embeddingsPDF import add_embeddings
        from utils.appendFiass import append_embeddings_to_faiss

        j = process_pdf(tmp_path, title)
        s = add_summaries(j, user_id)
        s["uploaded_by"] = user_id
        emb = add_embeddings(s)
        emb["uploaded_by"] = user_id

        os.makedirs(os.path.join(BASE_DIR, "tmp"), exist_ok=True)
        idx, meta, sidx, smeta = append_embeddings_to_faiss(
            [emb],
            FAISS_PATHS["global_idx"],
            FAISS_PATHS["meta_pkl"],
            FAISS_PATHS["sec_idx"],
            FAISS_PATHS["sec_meta"],
        )

        import faiss, pickle
        faiss.write_index(idx, FAISS_PATHS["global_idx"])
        pickle.dump(meta, open(FAISS_PATHS["meta_pkl"], "wb"))
        faiss.write_index(sidx, FAISS_PATHS["sec_idx"])
        pickle.dump(smeta, open(FAISS_PATHS["sec_meta"], "wb"))

        # Reload FAISS in app
        from app import reload_faiss
        reload_faiss()

        # Save paper metadata
        paper_doc = {
            "title": s.get("name", title),
            "authors": [a.get("name", "") for a in s.get("author", [])],
            "summary": s.get("global_summary", ""),
            "uploaded_by": user_id,
            "uploaded_at": datetime.now(timezone.utc),
            "pdf_path": tmp_path,
        }
        paper_result = await db.papers.insert_one(paper_doc)

        await db.uploads.update_one(
            {"_id": __import__("bson").ObjectId(upload_id)},
            {"$set": {"status": "completed", "paper_id": str(paper_result.inserted_id)}},
        )
        await db.users.update_one(
            {"_id": __import__("bson").ObjectId(user_id)},
            {"$inc": {"upload_count": 1}},
        )
        logger.info(f"PDF processed and indexed: {title}")

    except Exception as e:
        logger.error(f"PDF processing failed for {title}: {e}")
        await db.uploads.update_one(
            {"_id": __import__("bson").ObjectId(upload_id)},
            {"$set": {"status": "failed", "error": str(e)}},
        )


@router.post("")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    title = os.path.splitext(file.filename)[0]
    db = get_db()

    # Save temp file
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", dir=UPLOAD_DIR)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    tmp.write(content)
    tmp.close()

    # Create upload record
    upload_doc = {
        "filename": file.filename,
        "title": title,
        "user_id": current_user["sub"],
        "status": "pending",
        "uploaded_at": datetime.now(timezone.utc),
        "file_path": tmp.name,
    }
    result = await db.uploads.insert_one(upload_doc)
    upload_id = str(result.inserted_id)

    background_tasks.add_task(
        _process_pdf_background, upload_id, tmp.name, title, current_user["sub"]
    )

    return {
        "upload_id": upload_id,
        "filename": file.filename,
        "status": "pending",
        "message": "Upload received. Processing in background.",
    }


@router.get("/status/{upload_id}")
async def upload_status(upload_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    doc = await db.uploads.find_one({"_id": ObjectId(upload_id), "user_id": current_user["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {
        "upload_id": upload_id,
        "filename": doc["filename"],
        "status": doc["status"],
        "uploaded_at": doc["uploaded_at"],
        "error": doc.get("error"),
    }


@router.get("/my-uploads")
async def my_uploads(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.uploads.find(
        {"user_id": current_user["sub"]},
        {"file_path": 0},
    ).sort("uploaded_at", -1).limit(20)
    uploads = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        uploads.append(doc)
    return {"uploads": uploads}
