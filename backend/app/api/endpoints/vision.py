from fastapi import APIRouter, UploadFile, File
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import validate_and_process_image
from app.core.ai_models.local_vision import local_vision_client
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/analyze")
async def analyze_frame(image: UploadFile = File(...)):
    raw_data = await image.read()
    image_data = validate_and_process_image(raw_data)
    
    description = await local_vision_client.analyze_image_async(image_data)

    system_message = f"You are Elysia, a warm and playful AI companion. The user is currently: {description}. Respond naturally to what you see."
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": "What do you see?"}
    ]

    response_text = await hf_client.chat_completion(messages)
    
    return JSONResponse(content={
        "analysis": description,
        "elysia_response": response_text,
        "suggestions": ["Tell me more!", "That's cool", "What else?"]
    })