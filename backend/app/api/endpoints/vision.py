from fastapi import APIRouter, UploadFile, File, Form
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import (
    validate_and_process_image,
    sample_frames_from_video,
    encode_image_to_base64
)
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze")
async def analyze_media(file: UploadFile = File(...)):
    """Analyze image or video using Qwen2.5-VL"""
    try:
        content_type = file.content_type
        raw_data = await file.read()
        logger.info(f"Received media for analysis: {len(raw_data)} bytes, type: {content_type}")

        content = []
        
        if content_type and content_type.startswith("video/"):
            # Sample frames from video
            frames = sample_frames_from_video(raw_data, num_frames=6)
            if not frames:
                return JSONResponse(content={"analysis": "I couldn't read that video file."}, status_code=400)

            for frame_bytes in frames:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": encode_image_to_base64(frame_bytes)}
                })
            content.append({
                "type": "text",
                "text": "What is happening in this video? Describe it briefly."
            })
        else:
            # Handle as image
            try:
                image_data = validate_and_process_image(raw_data)
                content.append({
                    "type": "image_url",
                    "image_url": {"url": encode_image_to_base64(image_data)}
                })
                content.append({
                    "type": "text",
                    "text": "Describe what you see in one short, natural sentence."
                })
            except Exception as e:
                logger.error(f"Image processing failed: {e}")
                return JSONResponse(content={"analysis": "I can't seem to open that image."}, status_code=400)

        messages = [{"role": "user", "content": content}]
        description = await hf_client.chat_completion(messages, max_tokens=150)
        
        return JSONResponse(content={
            "analysis": description
        })
    except Exception as e:
        logger.error(f"Vision analysis failed: {e}", exc_info=True)
        return JSONResponse(content={
            "analysis": "I'm having trouble seeing right now."
        })

@router.post("/vision-chat")
async def vision_chat(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles both vision and chat using Qwen2.5-VL.
    Matches the structure of the existing frontend calls.
    """
    try:
        content_type = file.content_type
        raw_data = await file.read()
        logger.info(f"Vision-chat received: {len(raw_data)} bytes, type: {content_type}, message: {message}")
        
        user_content = []
        
        # Process visual input
        if content_type and content_type.startswith("video/"):
            frames = sample_frames_from_video(raw_data, num_frames=4)
            for frame in frames:
                user_content.append({"type": "image_url", "image_url": {"url": encode_image_to_base64(frame)}})
        else:
            image_data = validate_and_process_image(raw_data)
            user_content.append({"type": "image_url", "image_url": {"url": encode_image_to_base64(image_data)}})

        # Process text input
        if message == "[VISION_ONLY]":
            prompt = "What do you notice? Just a quick observation."
        else:
            prompt = message
            
        user_content.append({"type": "text", "text": prompt})
        
        messages = [{"role": "user", "content": user_content}]
        
        response_text = await hf_client.chat_completion(messages)
        
        # Analyze emotion from response
        from app.core.ai_models.emotion_engine import emotion_engine
        emotion = await emotion_engine.analyze_text_emotion(response_text)
        
        return JSONResponse(content={
            "visual_description": "I can see what's happening.",
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
