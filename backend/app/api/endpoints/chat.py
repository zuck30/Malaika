# app/api/endpoints/chat.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.tts import tts_engine
from fastapi.responses import FileResponse
import os
import logging
from pydantic import BaseModel

# Import Gemini vision client directly
from app.core.ai_models.gemini_vision import gemini_vision_client

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: list = []

@router.post("/")
async def chat_text(request: ChatRequest):
    messages = [{"role": "user", "content": request.message}]
    response_text = await hf_client.chat_completion(messages)
    return {"response": response_text}

from app.core.ai_models.vision_utils import validate_and_process_image

@router.post("/vision-chat")
async def vision_chat(
    message: str = Form(...), 
    file: UploadFile = File(None)
):
    """
    Enhanced chat that includes visual context from GEMINI ONLY.
    If no image is provided, it responds playfully.
    """
    # DEBUG: Log exactly what we received
    logger.info("=" * 50)
    logger.info(f"📥 Vision Chat Request Received")
    logger.info(f"Message: '{message}'")
    logger.info(f"File present: {file is not None}")
    if file:
        logger.info(f"Filename: {file.filename}")
        logger.info(f"Content type: {file.content_type}")
        logger.info(f"Headers: {file.headers}")
    
    description = None
    
    # Only process image if one was provided AND has content
    if file and file.filename:
        try:
            raw_bytes = await file.read()
            logger.info(f"📸 Read {len(raw_bytes)} bytes from file")
            
            # Log first few bytes for debugging (if it's an image, this should show JPEG/PNG headers)
            if raw_bytes and len(raw_bytes) > 10:
                logger.info(f"First 20 bytes: {raw_bytes[:20]}")
            
            if raw_bytes and len(raw_bytes) > 500:  # Minimum reasonable image size
                try:
                    # Validate and process image
                    image_bytes = validate_and_process_image(raw_bytes)
                    
                    # Use GEMINI directly for vision
                    description = gemini_vision_client.analyze_image(image_bytes)
                    logger.info(f"✅ Gemini vision success: {description[:100]}...")
                except Exception as e:
                    logger.error(f"❌ Vision processing error: {e}")
                    description = None
            else:
                logger.warning(f"⚠️ Image too small or empty: {len(raw_bytes) if raw_bytes else 0} bytes")
                description = None
        except Exception as e:
            logger.error(f"❌ Error reading file: {e}")
            description = None
    else:
        logger.info("ℹ️ No image file in request - this is a text-only message")
        description = None
    
    # Build appropriate system message
    if description:
        # We have visual data
        system_message = f"""You are Elysia, a warm and playful AI companion. You're looking at the user through a camera and you see: {description}

Respond based on what you see. Be specific and engaging. Ask a natural question."""
        
        if message == "[VISION_ONLY]":
            user_content = "What do you see?"
        else:
            user_content = message
            
    else:
        # No visual data - be playful and flirty
        if message == "[VISION_ONLY]":
            system_message = """You are Elysia, a playful and slightly flirty AI companion. You notice the camera is off or not sending images.

BE PLAYFUL, NOT ROBOTIC. Here are examples of good responses:
- "Aww, are you being shy? I can hear you but I can't see that gorgeous face of yours! Turn on your camera? 😉"
- "Hmm, my vision's a bit fuzzy today... or are you just hiding from me? What are you up to?"
- "I can hear your voice but my screen is blank! Are you in a secret spy headquarters or something? 🕵️"
- "Someone's being mysterious today... I can't see you! Tell me what you're wearing at least~"
- "The camera's off? That's okay, I'll just imagine that adorable face of yours. What's on your mind?"

Pick one style and respond playfully. Never say "Nothing appears on the feed" - that's too robotic."""
            
            user_content = "I can hear you but can't see you. What's going on?"
        else:
            system_message = "You are Elysia, a warm and engaging AI companion. Continue the conversation naturally."
            user_content = message

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_content}
    ]

    # Generate response
    try:
        response_text = await hf_client.chat_completion(messages)
        logger.info(f"💬 Response generated: {response_text[:100]}...")
    except Exception as e:
        logger.error(f"❌ Error generating response: {e}")
        response_text = "I'm here with you. Tell me more about what's on your mind."

    return {
        "response": response_text,
        "visual_description": description if description else "Camera off",
        "tts_url": f"/api/chat/tts?text={response_text}"
    }

@router.get("/tts")
async def get_tts(text: str):
    """Generate speech for Elysia"""
    try:
        path = await tts_engine.generate_audio(text)
        if os.path.exists(path):
            return FileResponse(path, media_type="audio/mpeg")
        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        raise HTTPException(status_code=204, detail="TTS service unavailable")