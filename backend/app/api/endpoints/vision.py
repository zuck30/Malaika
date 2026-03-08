from fastapi import APIRouter, UploadFile, File, Form
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import validate_and_process_image
from app.core.ai_models.local_vision import local_vision_client
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze")
async def analyze_frame(image: UploadFile = File(...)):
    """Legacy endpoint - just analyze the image"""
    try:
        raw_data = await image.read()
        logger.info(f"Received image for analysis: {len(raw_data)} bytes")
        
        image_data = validate_and_process_image(raw_data)
        description = await local_vision_client.analyze_image_async(image_data)
        
        return JSONResponse(content={
            "analysis": description
        })
    except Exception as e:
        logger.error(f"Vision analysis failed: {e}")
        return JSONResponse(content={
            "analysis": "I'm having trouble seeing right now."
        })

@router.post("/vision-chat")
async def vision_chat(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    """New endpoint that handles both vision and chat"""
    try:
        # Read and analyze the image
        raw_data = await file.read()
        logger.info(f"Vision-chat received: {len(raw_data)} bytes, message: {message}")
        
        image_data = validate_and_process_image(raw_data)
        description = await local_vision_client.analyze_image_async(image_data)
        
        # If this is just a vision update (no user message), generate a spontaneous response
        if message == "[VISION_ONLY]":
            system_message = f"""You are Elysia, a warm and playful AI companion. 
You just saw this: {description}
Respond naturally and briefly to what you see, as if you're making an observation. 
Keep it short and playful, like a friend would."""
            
            user_content = "What do you notice?"
        else:
            # User sent a message with the image
            system_message = f"""You are Elysia, a warm and playful AI companion. 
You can see that: {description}
Respond naturally to the user's message, acknowledging what you see."""
            
            user_content = message
        
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_content}
        ]
        
        response_text = await hf_client.chat_completion(messages)
        
        # Analyze emotion from response
        from app.core.ai_models.emotion_engine import emotion_engine
        emotion = await emotion_engine.analyze_text_emotion(response_text)
        
        return JSONResponse(content={
            "visual_description": description,
            "response": response_text,
            "emotion": emotion
        })
        
    except Exception as e:
        logger.error(f"Vision chat failed: {e}", exc_info=True)
        return JSONResponse(content={
            "visual_description": "I'm having trouble seeing clearly right now.",
            "response": "I blinked! What were you saying?",
            "emotion": "confused"
        })