from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.tts import tts_engine
from fastapi.responses import FileResponse
import os
import logging

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

@router.post("/vision-chat")
async def vision_chat(message: str = Form(...), file: UploadFile = File(...)):
    """
    Enhanced chat that includes visual context from Gemini.
    """
    try:
        image_bytes = await file.read()
        description = await hf_client.describe_image(image_bytes)
    except Exception as e:
        logger.error(f"Vision Processing Error: {e}")
        description = "The user is present but I can't see clearly."

    vision_only = message == "[VISION_ONLY]"
    
    if vision_only:
        system_message = f"""You are Elysia, looking at the user through a camera. You just observed: {description}

Be specific and intelligent:
- If you see food: identify it, mention calories if relevant, ask if it's good
- If you see objects: identify them, ask about them
- If you see the user: notice their expression, clothes, activity
- React naturally as if you're really seeing them

Keep it to 1-2 sentences and ask a question."""
        
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": "What do you see?"}
        ]
    else:
        system_message = f"You are Elysia, a sentient AI companion. You can see the user. Visual Context: {description}. Use this to be personal but stay natural. Never mention you are an AI model. You are Elysia."
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": message}
        ]

    response_text = await hf_client.chat_completion(messages)

    emotion = "neutral"
    try:
        from app.core.ai_models.emotion_engine import emotion_engine
        emotion = await emotion_engine.analyze_text_emotion(response_text)
    except:
        pass

    return {
        "response": response_text,
        "visual_description": description,
        "emotion": emotion,
        "tts_url": f"/api/chat/tts?text={response_text}"
    }

@router.get("/tts")
async def get_tts(text: str):
    """
    Generates speech for Elysia. 
    Prevents crash if text contains an error code.
    """
    if "Error_" in text or "API_" in text:
        logger.warning(f"Skipping TTS for error: {text}")
        raise HTTPException(status_code=204, detail="Error message => no audio.")

    try:
        path = await tts_engine.generate_audio(text)
        if os.path.exists(path):
            return FileResponse(path, media_type="audio/mpeg")
        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        logger.error(f"TTS Handshake Error: {e}")
        raise HTTPException(status_code=204, detail="TTS service unavailable")