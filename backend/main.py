import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import answers, progress, sessions

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Interview Coach API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(answers.router)
app.include_router(progress.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
