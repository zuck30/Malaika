import os
import base64
import logging
import google.generativeai as genai
from PIL import Image
import io

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
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("✅ Gemini vision client initialized")
    
    def analyze_image(self, image_data) -> str:
        """
        Analyze image using Google Gemini.
        Requirement 1: Reset BytesIO position to 0.
        Requirement 2: Use PIL to validate and convert to JPEG/PNG.
        """
        if not self.model:
            return "Vision service not available - API key missing"
        
        try:
            # Handle potential BytesIO object (Requirement 1)
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

            # Requirement 2: Use PIL to validate and convert
            try:
                image = Image.open(io.BytesIO(image_bytes))
                # Ensure it's in a standard format (RGB)
                if image.mode != 'RGB':
                    image = image.convert('RGB')

                # We can pass the PIL image directly to Gemini SDK
            except Exception as e:
                logger.error(f"PIL failed to process image: {e}")
                return "I'm having trouble identifying this image format."
            
            prompt = "Describe what you see in detail. Be specific about objects, food, people, and activities. Keep it to 1-2 sentences."
            
            # Use PIL image directly with Gemini SDK
            response = self.model.generate_content([prompt, image])
            
            if not response or not hasattr(response, 'text'):
                logger.error("Gemini returned empty or invalid response")
                return "I see you, but I'm having trouble describing it right now."

            description = response.text
            logger.info(f"✅ Gemini vision: {description}")
            return description
            
        except Exception as e:
            logger.error(f"❌ Gemini vision failed: {e}", exc_info=True)
            return "I see you there, but I'm having trouble making out the details."

# Create singleton
gemini_vision_client = GeminiVisionClient()
