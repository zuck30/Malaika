import logging
import asyncio
from functools import partial
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import encode_image_to_base64

logger = logging.getLogger(__name__)

class LocalVisionClient:
    """
    Deprecated: Local Moondream2 model loading is removed.
    Now redirects requests to the Hugging Face Serverless API via hf_client.
    """
    def __init__(self):
        logger.info("LocalVisionClient initialized (Cloud-Redirect mode)")
        self.model = None # Local weights no longer loaded

    def analyze_image(self, image_bytes: bytes) -> str:
        """
        Analyze image using Qwen2.5-VL via hf_client.
        Synchronous wrapper for backward compatibility.
        """
        try:
            # We use an event loop to run the async call synchronously
            # This is a bit hacky but keeps compatibility with existing sync callers if any
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            if loop.is_running():
                # If we are already in an async context, this might fail or block
                # Caller should ideally use analyze_image_async
                return "Vision system is busy."
            
            return loop.run_until_complete(self.analyze_image_async(image_bytes))
        except Exception as e:
            logger.error(f"Sync analyze_image redirect failed: {e}")
            return "I'm having trouble seeing right now."

    async def analyze_image_async(self, image_bytes: bytes) -> str:
        """
        Redirect to Qwen2.5-VL via hf_client.
        """
        try:
            base64_image = encode_image_to_base64(image_bytes)
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe what you see in one short sentence."},
                        {"type": "image_url", "image_url": {"url": base64_image}}
                    ]
                }
            ]
            
            description = await hf_client.chat_completion(messages, max_tokens=100)
            logger.info(f"Vision redirection result: {description}")
            return description
            
        except Exception as e:
            logger.error(f"Vision redirection failed: {e}")
            return "someone I can't quite see clearly"

# Initialize the client
local_vision_client = LocalVisionClient()
