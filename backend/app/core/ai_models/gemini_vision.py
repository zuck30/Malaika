# app/core/ai_models/gemini_vision.py
import os
import base64
import logging
import google.generativeai as genai
from PIL import Image
import io
import asyncio
from functools import partial

logger = logging.getLogger(__name__)

class GeminiVisionClient:
    def __init__(self):
        # Load from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.error("GOOGLE_API_KEY not set in environment!")
            # Try to load from .env file directly as fallback
            try:
                from dotenv import load_dotenv
                load_dotenv(override=True)
                api_key = os.getenv("GOOGLE_API_KEY")
                logger.info(f"Reloaded .env, key present: {bool(api_key)}")
            except Exception as e:
                logger.error(f"Failed to reload .env: {e}")
        
        if not api_key:
            logger.error("GOOGLE_API_KEY still not available after reload!")
            self.model = None
        else:
            genai.configure(api_key=api_key)
            # Use gemini-1.5-flash for faster responses
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("✅ Gemini vision client initialized")
    
    def analyze_image(self, image_data) -> str:
        """
        Analyze image using Google Gemini.
        This is a synchronous method that can be called from async endpoints.
        """
        if not self.model:
            return "Vision service not available - API key missing"
        
        try:
            # Handle potential BytesIO object
            if isinstance(image_data, io.BytesIO):
                image_data.seek(0)
                image_bytes = image_data.read()
            elif isinstance(image_data, str):
                # Handle base64 string
                if "," in image_data:
                    image_data = image_data.split(",")[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data

            # Use PIL to validate and convert
            try:
                image = Image.open(io.BytesIO(image_bytes))
                # Ensure it's in a standard format (RGB)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                logger.info(f"Image processed: {image.size}, mode: {image.mode}")
            except Exception as e:
                logger.error(f"PIL failed to process image: {e}")
                return "I'm having trouble identifying this image format."
            
            # Different prompts based on what we might be seeing
            prompt = """Describe what you see in this image in 1-2 sentences. 
            If there's a person, describe their appearance, expression, and what they're doing.
            If there's food, identify it and describe it.
            If there are objects, name them.
            Be specific and natural."""
            
            # Use PIL image directly with Gemini SDK
            response = self.model.generate_content([prompt, image])
            
            if not response or not hasattr(response, 'text'):
                logger.error("Gemini returned empty or invalid response")
                return "I see you, but I'm having trouble describing it right now."

            description = response.text.strip()
            logger.info(f"✅ Gemini vision success: {len(description)} chars")
            return description
            
        except Exception as e:
            logger.error(f"❌ Gemini vision failed: {e}", exc_info=True)
            return "I see you there, but I'm having trouble making out the details."
    
    async def analyze_image_async(self, image_data) -> str:
        """
        Async wrapper for analyze_image
        """
        # Run the synchronous analyze_image in a thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            partial(self.analyze_image, image_data)
        )
        return result

# Create singleton
gemini_vision_client = GeminiVisionClient()