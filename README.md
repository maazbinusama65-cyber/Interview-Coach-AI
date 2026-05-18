# AI Interview Coach

Role-specific mock interview platform powered by Groq LLaMA 3.1.  
Generates tailored questions, evaluates answers with structured scoring, and tracks your weaknesses across sessions.

## Features

- **Role-specific questions** — ML Engineer, Backend Dev, Frontend Dev, Data Scientist, and more
- **AI evaluation** — score (1–10), strengths, gaps, model answer, and actionable tip per question
- **Weakness tracker** — running average by topic, persisted across sessions
- **Session history** — radar chart summary per session, full dashboard
- **Guest mode** — no account needed to practice; sign in to save progress

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Backend | FastAPI + SQLAlchemy (async) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| LLM | Groq LLaMA 3.1 via LangChain |
| Deploy | Render (API) + Vercel (frontend) |

## Local Development

### Prerequisites

- Python 3.11+
- Node 20+
- A Supabase project (free at supabase.com)
- A Groq API key (free at console.groq.com)

### 1. Clone and configure

```bash
git clone <repo-url>
cd interview-coach
cp .env
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY, DATABASE_URL, SECRET_KEY
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head          # runs migrations against your Supabase DB
uvicorn main:app --reload     # http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

### 4. Docker Compose (full stack)

```bash
cp .env          # fill in values
docker-compose up
```

Backend at `http://localhost:8000`, frontend at `http://localhost:3000`.

## Running Tests

```bash
# Backend
cd backend
pytest tests/ -v --cov=. --cov-report=term-missing

# Frontend
cd frontend
npm test
```

## Deployment

### Backend → Render

1. Create a new **Web Service** in Render, connect your repo
2. Set root directory to `backend/`
3. Build command: `pip install -r requirements.txt && alembic upgrade head`
4. Start command: `gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
5. Add environment variables from `.env.example`

### Frontend → Vercel

1. Import the repo in Vercel
2. Set root directory to `frontend/`
3. Add `VITE_API_BASE_URL` pointing to your Render service URL
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## API Reference

```
POST  /api/sessions                  Create session + generate questions
GET   /api/sessions                  List user's past sessions
GET   /api/sessions/{id}             Get session + questions
POST  /api/sessions/{id}/complete    Mark complete, compute total_score
POST  /api/answers                   Submit answer → AI evaluation
GET   /api/sessions/{id}/summary     Full session with answers + scores
GET   /api/progress                  Weakness tracker for current user
GET   /api/topics                    Topics seen by current user
GET   /health                        Health check
```

Interactive docs: `http://localhost:8000/docs`

## Project Structure

```
interview-coach/
├── backend/
│   ├── main.py              FastAPI app + CORS
│   ├── config.py            Env vars (pydantic-settings)
│   ├── database.py          SQLAlchemy async engine
│   ├── models.py            ORM models
│   ├── schemas.py           Pydantic request/response schemas
│   ├── auth.py              Supabase JWT verification
│   ├── routers/             sessions, answers, progress
│   ├── services/            ai_service, weakness_service
│   ├── alembic/             migrations
│   └── tests/               pytest suite
└── frontend/
    └── src/
        ├── api/             typed fetch wrappers
        ├── hooks/           useAuth
        ├── pages/           Landing, Login, Setup, Interview, Summary, Dashboard, Topic
        └── types/           TypeScript interfaces
```

## Resume Bullets

- Built AI Interview Coach, a full-stack mock interview platform using Groq LLaMA 3.1 to generate role-specific question sets and evaluate answers with structured scoring, strengths/gaps analysis, and model answers — deployed on Render + Vercel
- Designed a running-average weakness tracker across sessions that surfaces low-scoring topics, enabling users to identify and drill specific knowledge gaps over time
- Implemented Pydantic-validated LLM output pipelines for both question generation and answer evaluation, ensuring consistent structured JSON output from LLaMA 3.1
