import os
import faiss
import pickle
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database.mongodb import connect_db, disconnect_db
from routes.auth import router as auth_router
from routes.search import router as search_router
from routes.upload import router as upload_router
from routes.analytics import router as analytics_router
from routes.users import router as users_router
from utils.logger import get_logger

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
faiss_state: dict = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TMP_DIR = os.path.join(BASE_DIR, "tmp")

FAISS_PATHS = {
    "global_idx": os.path.join(TMP_DIR, "faiss_global.idx"),
    "meta_pkl":   os.path.join(TMP_DIR, "faiss_metadata.pkl"),
    "sec_idx":    os.path.join(TMP_DIR, "faiss_sections.idx"),
    "sec_meta":   os.path.join(TMP_DIR, "faiss_section_meta.pkl"),
}

def load_faiss():
    try:
        faiss_state["global_idx"]   = faiss.read_index(FAISS_PATHS["global_idx"])
        faiss_state["metadata"]     = pickle.load(open(FAISS_PATHS["meta_pkl"], "rb"))
        faiss_state["section_idx"]  = faiss.read_index(FAISS_PATHS["sec_idx"])
        faiss_state["section_meta"] = pickle.load(open(FAISS_PATHS["sec_meta"], "rb"))
        logger.info("FAISS indexes loaded successfully")
    except Exception as e:
        faiss_state.clear()
        logger.warning(f"FAISS indexes not found: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    load_faiss()
    yield
    await disconnect_db()

app = FastAPI(title="Semantic Research Search API", version="2.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://semantic-search-prod.vercel.app"
    ).split(",")
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(search_router,    prefix="/api/search",    tags=["Search"])
app.include_router(upload_router,    prefix="/api/upload",    tags=["Upload"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(users_router,     prefix="/api/users",     tags=["Users"])

@app.get("/")
def root():
    return {"status": "running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "faiss_loaded": bool(faiss_state.get("global_idx"))}

def get_faiss_state():
    return faiss_state

def reload_faiss():
    load_faiss()
