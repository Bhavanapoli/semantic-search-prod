# SemanticSearch AI — Full Stack Production App

A production-ready semantic search platform for academic research papers, powered by **FAISS**, **Sentence Transformers**, **FastAPI**, **MongoDB**, and **React**.

---

## Architecture

```
React (Vite + Tailwind)   ──→   FastAPI Backend
        ↓                              ↓
    Vercel                       MongoDB Atlas
                                       ↓
                               FAISS Vector Index
```

---

## Quick Start (Local Dev)

### 1. Clone & configure

```bash
git clone <your-repo>
cd semantic-search-prod

# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET_KEY, MONGO_URI
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Copy your existing FAISS indexes into backend/tmp/
# Copy your MLModels/ folder into backend/MLModels/

uvicorn app:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000/api
npm run dev
```

Visit `http://localhost:5173`

---

## Docker Compose (Recommended)

```bash
# 1. Build frontend
cd frontend && npm install && npm run build && cd ..

# 2. Configure env
cp backend/.env.example backend/.env
# Edit backend/.env

# 3. Start all services
docker compose up -d

# 4. Check logs
docker compose logs -f backend
```

Services:
| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:8000    |
| MongoDB  | mongodb://localhost:27017 |

---

## Google Cloud VM Deployment

### VM Setup

```bash
# 1. Create VM (GCP Console or CLI)
gcloud compute instances create semantic-search \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server

# 2. Allow ports
gcloud compute firewall-rules create allow-web \
  --allow tcp:80,tcp:443,tcp:8000 \
  --target-tags http-server,https-server

# 3. SSH into VM
gcloud compute ssh semantic-search --zone=us-central1-a
```

### Install dependencies on VM

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Deploy backend

```bash
# Clone or SCP your project
git clone <your-repo> && cd semantic-search-prod

# Configure production .env
cp backend/.env.example backend/.env
nano backend/.env
# Set: MONGO_URI, JWT_SECRET_KEY, ALLOWED_ORIGINS

# Build & start
cd frontend && npm install && npm run build && cd ..
docker compose -f docker-compose.yml up -d
```

### Nginx + HTTPS

```bash
# /etc/nginx/sites-available/semantic-search
sudo nano /etc/nginx/sites-available/semantic-search
```

```nginx
server {
    server_name yourdomain.com;

    location / {
        root /home/ubuntu/semantic-search-prod/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 60M;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/semantic-search /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS with Certbot
sudo certbot --nginx -d yourdomain.com
```

---

## Vercel Frontend Deployment

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard:
# VITE_API_URL = https://your-gcp-vm-ip-or-domain/api
```

---

## Project Structure

```
semantic-search-prod/
│
├── backend/
│   ├── app.py                 # FastAPI entrypoint
│   ├── auth/
│   │   └── jwt_handler.py     # JWT tokens, password hashing
│   ├── database/
│   │   └── mongodb.py         # Motor async MongoDB client
│   ├── models/
│   │   └── schemas.py         # Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py            # /api/auth/*
│   │   ├── search.py          # /api/search
│   │   ├── upload.py          # /api/upload
│   │   ├── analytics.py       # /api/analytics/*
│   │   └── users.py           # /api/users/*
│   ├── utils/
│   │   ├── query.py           # ← Existing FAISS search (unchanged)
│   │   ├── pdfExt.py          # ← Existing PDF extraction (unchanged)
│   │   ├── embeddingsPDF.py   # ← Existing embeddings (unchanged)
│   │   ├── summarize.py       # ← Existing summarizer (unchanged)
│   │   ├── appendFiass.py     # ← Existing FAISS append (unchanged)
│   │   ├── garbage_check.py   # ← Existing query filter (unchanged)
│   │   └── logger.py          # Structured logging
│   ├── MLModels/              # ← Your existing MLModels folder
│   ├── tmp/                   # FAISS index files
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx    # Public landing page
│   │   │   ├── Login.jsx      # JWT login
│   │   │   ├── Signup.jsx     # Registration with strength meter
│   │   │   ├── Dashboard.jsx  # User dashboard
│   │   │   ├── Search.jsx     # Semantic search UI
│   │   │   ├── Upload.jsx     # PDF drag-and-drop upload
│   │   │   ├── Profile.jsx    # User profile & stats
│   │   │   └── AdminDashboard.jsx  # Admin analytics
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PaperCard.jsx
│   │   │   ├── SectionCard.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   ├── services/
│   │   │   └── api.js          # Axios + auto token refresh
│   │   └── App.jsx             # React Router routes
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── nginx/
│   └── nginx.conf
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## API Reference

| Method | Endpoint                  | Auth     | Description            |
|--------|---------------------------|----------|------------------------|
| POST   | /api/auth/register        | No       | Create account         |
| POST   | /api/auth/login           | No       | Get JWT tokens         |
| POST   | /api/auth/refresh         | No       | Refresh access token   |
| GET    | /api/auth/me              | User     | Current user info      |
| POST   | /api/search               | User     | Semantic search        |
| GET    | /api/search/history       | User     | Query history          |
| GET    | /api/search/suggestions   | User     | Popular queries        |
| POST   | /api/upload               | User     | Upload PDF             |
| GET    | /api/upload/status/:id    | User     | Upload status          |
| GET    | /api/upload/my-uploads    | User     | User's uploads         |
| GET    | /api/analytics/summary    | Admin    | Platform stats         |
| GET    | /api/analytics/query-trend| Admin    | Query trend data       |
| GET    | /api/analytics/users/stats| User     | Personal stats         |
| GET    | /api/users/profile        | User     | Profile                |
| PATCH  | /api/users/profile        | User     | Update profile         |
| GET    | /api/users/papers         | User     | My uploaded papers     |
| GET    | /api/users/all            | Admin    | All users              |

Interactive docs: `http://localhost:8000/docs`

---

## MongoDB Collections

| Collection | Purpose                     |
|------------|-----------------------------|
| `users`    | Accounts, roles, stats      |
| `papers`   | Indexed paper metadata      |
| `queries`  | Search query logs           |
| `uploads`  | Upload status tracking      |

---

## Environment Variables

```env
# backend/.env
JWT_SECRET_KEY=your-very-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=semantic_search
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
UPLOAD_DIR=./uploads
```

```env
# frontend/.env.local
VITE_API_URL=http://localhost:8000/api
```

---

## Existing ML Code Integration

The following files from your original project are used **unchanged**:

- `utils/query.py` — unified FAISS semantic search
- `utils/pdfExt.py` — PDF section extraction
- `utils/embeddingsPDF.py` — SentenceTransformer embeddings
- `utils/summarize.py` — HuggingFace summarization
- `utils/appendFiass.py` — FAISS index update
- `utils/garbage_check.py` — academic query classifier
- `MLModels/models.py` — your model loaders (copy into backend/MLModels/)

---

## Create First Admin User

```python
# Run once in Python shell or create a script
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import asyncio

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.semantic_search
    pwd = CryptContext(schemes=["bcrypt"]).hash("your-admin-password")
    await db.users.insert_one({
        "username": "admin",
        "email": "admin@example.com",
        "hashed_password": pwd,
        "role": "admin",
        "search_count": 0,
        "upload_count": 0,
    })
    print("Admin created")

asyncio.run(create_admin())
```

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts |
| Backend     | FastAPI, Uvicorn, Gunicorn               |
| Auth        | JWT (python-jose), bcrypt (passlib)      |
| Database    | MongoDB (Motor async driver)             |
| Search      | FAISS, Sentence Transformers             |
| NLP         | HuggingFace Transformers, scispacy       |
| Container   | Docker, Docker Compose                   |
| Web Server  | Nginx                                    |
| Cloud       | Google Cloud Compute Engine + Vercel     |
