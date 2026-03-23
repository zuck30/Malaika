from dotenv import load_dotenv
load_dotenv(override=True)

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import chat, vision, emotion
from app.api.websocket import chat_ws
from app.core.ai_models.hf_client import hf_client
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not os.getenv("HUGGINGFACE_API_KEY"):
        logger.warning("HUGGINGFACE_API_KEY is not set! AI features will not work.")
    yield
    # Shutdown
    logger.info("Shutting down Hugging Face client")
    await hf_client.close()

app = FastAPI(
    title="Malaika-AI Companion API",
    lifespan=lifespan
)

# Configure CORS for React frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for REST endpoints
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["emotion"])

@app.get("/")
async def root():
    return {"message": "Malaika-AI Companion API is running"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat.
    """
    try:
        await chat_ws.handle_websocket(websocket)
    except Exception as e:
        logger.error(f"WebSocket runtime error: {e}")