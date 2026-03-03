from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import chat, vision, emotion
from app.api.websocket import chat_ws
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Elysia-AI Companion API")

@app.on_event("startup")
async def startup_event():
    # Check all required keys
    if not os.getenv("HUGGINGFACE_API_KEY"):
        logger.warning("HUGGINGFACE_API_KEY is not set! AI features will not work.")
    if not os.getenv("GOOGLE_API_KEY"):
        logger.warning("GOOGLE_API_KEY is not set! Vision features will not work.")
    else:
        logger.info("✅ GOOGLE_API_KEY is set, Vision enabled")

# Configure CORS => Muhimu kwa ajili ya mawasiliano na React frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers kwa ajili ya REST endpoints
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["emotion"])

@app.get("/")
async def root():
    return {"message": "Elysia-AI Companion API is running"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """
    Hapa ndipo Elysia anapopokea texts na pics.
    Tunatumia 'chat_ws.handle_websocket' ambayo i checked ipo.
    """
    try:
        # We call function directly from module ya chat_ws
        await chat_ws.handle_websocket(websocket)
    except Exception as e:
        logger.error(f"WebSocket Runtime Error: {e}")
        # This prevents server isizime (crash) kama kuna tatizo la connection