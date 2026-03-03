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
    
    def analyze_image(self, image_bytes: bytes) -> str:
        """
        Analyze image using Google Gemini (free tier).
        Handles both raw bytes and base64 encoded images.
        """
        if not self.model:
            return "Vision service not available - API key missing"
        
        try:
            # Check if it's a base64 string
            if isinstance(image_bytes, bytes):
                # Try to detect if it's base64 encoded
                try:
                    # If it starts with common base64 image prefixes
                    text = image_bytes.decode('utf-8', errors='ignore')
                    if text.startswith('data:image'):
                        # Extract base64 from data URI
                        base64_data = text.split(',')[1]
                        image_bytes = base64.b64decode(base64_data)
                        logger.info("Extracted image from data URI")
                except:
                    pass  # It's raw bytes, proceed
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            prompt = "Describe what you see in detail. Be specific about objects, food, people, and activities. Keep it to 1-2 sentences."
            
            response = self.model.generate_content([prompt, image])
            
            description = response.text
            logger.info(f"✅ Gemini vision: {description}")
            return description
            
        except Exception as e:
            logger.error(f"❌ Gemini vision failed: {e}")
            # Return error so fallback kicks in
            return "I see you there, but I'm having trouble making out the details."

# Create singleton
gemini_vision_client = GeminiVisionClient()