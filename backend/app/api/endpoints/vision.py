from fastapi import APIRouter, UploadFile, File
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import validate_and_process_image
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/analyze")
async def analyze_frame(image: UploadFile = File(...)):
    raw_data = await image.read()
    image_data = validate_and_process_image(raw_data)
    
    result = await hf_client.analyze_image_intelligent(image_data)
    
    return JSONResponse(content={
        "analysis": result["description"],
        "elysia_response": result["response"],
        "suggestions": result["suggestions"]
    })