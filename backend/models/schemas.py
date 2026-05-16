from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── User models ────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime
    search_count: int = 0
    upload_count: int = 0


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None


# ── Paper models ───────────────────────────────────────────────────────────────
class PaperOut(BaseModel):
    id: str
    title: str
    authors: List[str]
    summary: str
    uploaded_by: str
    uploaded_at: datetime
    pdf_path: Optional[str] = None


# ── Search models ──────────────────────────────────────────────────────────────
class SearchQuery(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)


class SectionResult(BaseModel):
    title: str
    section_name: str
    text: str
    score: float


class PaperResult(BaseModel):
    rank: int
    title: str
    authors: str
    summary: str
    score: float


class SearchResponse(BaseModel):
    query: str
    answer: Optional[str] = None
    sections: List[SectionResult]
    papers: List[PaperResult]
    result_count: int
    query_id: Optional[str] = None


# ── Upload models ──────────────────────────────────────────────────────────────
class UploadStatus(BaseModel):
    upload_id: str
    filename: str
    status: str
    message: str


# ── Analytics models ───────────────────────────────────────────────────────────
class AnalyticsOut(BaseModel):
    total_users: int
    total_papers: int
    total_queries: int
    queries_today: int
    top_queries: List[dict]
    recent_uploads: List[dict]


# ── Token models ───────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str
