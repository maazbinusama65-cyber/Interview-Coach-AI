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
