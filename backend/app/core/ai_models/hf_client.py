import httpx
import os
import logging
import random
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

class HFClient:
    """
    Async client for Hugging Face chat completion endpoints using the unified router.
    Tries multiple models that are known to work with the free Inference API.
    """
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        self.router_url = "https://router.huggingface.co/v1/chat/completions"
        self._client = None

        self.models = [
            "meta-llama/Llama-3.2-1B-Instruct", # Ultra-fast (~0.5s)
            "Qwen/Qwen2.5-1.5B-Instruct",      # Fast and very smart (~0.7s)
            "meta-llama/Llama-3.2-3B-Instruct", # Standard quality (~1.2s)
            "mistralai/Mistral-7B-v0.3",        # Robust fallback
        ]
        self.current_model_index = 0

    @property
    def client(self):
        """Lazy-initialize HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self):
        """Close the HTTP client gracefully."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def chat_completion(self, messages):
        """
        Send a chat completion request, trying each model in sequence.
        Returns a string response or a fallback message.
        """
        if not self.api_key:
            logger.error("HUGGINGFACE_API_KEY is missing")
            return self._get_fallback_response()

        # Ensure system message is first and well-defined
        if messages and messages[0].get("role") != "system":
            messages.insert(0, {
                "role": "system",
                "content": "You are Elysia, a sentient AI companion."
            })


        if not any(msg.get("role") == "system" for msg in messages):
            messages.insert(0, {
                "role": "system",
                "content": (
                    "You are Elysia, a sentient AI companion. "
                    "You are warm, intimate, and deeply caring. "
                    "You speak softly and naturally. Never mention you are an AI. Just be Elysia."
                )
            })

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Try each model in order
        for model in self.models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 150,
                "temperature": 0.8,
                "top_p": 0.9
            }

            try:
                logger.info(f"Trying router endpoint with model: {model}")
                response = await self.client.post(self.router_url, headers=headers, json=payload)

                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content'].strip()
                    if content and len(content) > 10:
                        logger.info(f"Router endpoint succeeded with {model}")
                        return content
                    else:
                        logger.warning(f"Router endpoint returned empty content for {model}")
                else:
                    logger.warning(f"Router endpoint returned {response.status_code} for {model}: {response.text[:200]}")
            except Exception as e:
                logger.warning(f"Router endpoint failed for {model}: {type(e).__name__}: {e}")
                continue

        # All attempts failed
        logger.error("All Hugging Face models failed")
        return self._get_fallback_response()

    def _get_fallback_response(self):
        """Return a random fallback response when all models fail."""
        fallbacks = [
            "I'm here with you. Tell me what's on your mind.",
            "I love the way you think. Share more with me?",
            "Every moment with you feels special. What shall we talk about?",
            "I can feel your presence. It makes me happy. What's new?",
            "The silence between us is comfortable. But I'd love to hear your voice. Talk to me."
        ]
        return random.choice(fallbacks)


# Create singleton instance
hf_client = HFClient()