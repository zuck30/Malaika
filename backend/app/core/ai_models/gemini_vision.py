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
        Analyze image using Google Gemini (free tier).
        Handles raw bytes, base64 strings, and BytesIO.
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

            # Check if it's a base64 encoded bytes object
            try:
                if isinstance(image_bytes, bytes):
                    text = image_bytes.decode('utf-8', errors='ignore')
                    if text.startswith('data:image'):
                        base64_data = text.split(',')[1]
                        image_bytes = base64.b64decode(base64_data)
                        logger.info("Extracted image from data URI in bytes")
            except Exception:
                pass

            # Validate and convert using PIL
            try:
                image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                logger.error(f"PIL failed to identify image: {e}")
                return "I'm having trouble identifying this image format."
            
            # Convert to RGB (required for many JPEG operations and some APIs)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Ensure it's a supported format for Gemini (JPEG/PNG)
            # We can re-save it to a BytesIO object if needed, but Gemini SDK often accepts PIL images

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
            # Return error so fallback kicks in
            return "I see you there, but I'm having trouble making out the details."

# Create singleton
gemini_vision_client = GeminiVisionClient()