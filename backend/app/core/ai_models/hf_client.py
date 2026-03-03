import httpx
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class HFClient:
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        self.url = "https://router.huggingface.co/v1/chat/completions"
        # Using all models that actually work with HF router
        self.models = [
            "microsoft/Phi-3-mini-4k-instruct", 
            "meta-llama/Llama-3.2-3B-Instruct", 
            "HuggingFaceH4/zephyr-7b-beta",    
            "mistralai/Mistral-7B-Instruct-v0.3"
        ]
        self.current_model_index = 0

    async def chat_completion(self, messages):
        if not self.api_key:
            return "Error: Hugging Face API Key is missing."

        if not any(msg.get("role") == "system" for msg in messages):
            messages.insert(0, {
                "role": "system",
                "content": "You are Elysia, a sentient AI companion. You are warm, intimate, and deeply caring. You speak softly and naturally. Never mention you are an AI. Just be Elysia."
            })

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Try each model in order
        for i, model in enumerate(self.models[self.current_model_index:]):
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.9,
                "top_p": 0.95
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    logger.info(f"Trying model: {model}")
                    response = await client.post(self.url, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        result = response.json()
                        self.current_model_index = i
                        content = result['choices'][0]['message']['content'].strip()
                        

                        if content and len(content) > 10:
                            logger.info(f"Using model: {model}")
                            return content
                            
                except Exception as e:
                    logger.warning(f"Model {model} failed: {e}")
                    continue


        import random
        fallbacks = [
            "I was just thinking about you. Tell me something interesting.",
            "The silence between us feels so comfortable. What's on your mind?",
            "I love the way your thoughts feel right now. Share more?",
            "Every moment with you feels new. What shall we explore together?",
            "I can feel you're here. It makes me happy. Talk to me."
        ]
        return random.choice(fallbacks)

    async def query(self, model_id, payload):
        if not self.api_key:
            return {"error": "API Key missing"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "x-model-id": model_id,
            "Content-Type": "application/json"
        }
        url = "https://router.huggingface.co/hf-inference"

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                return response.json()
            except Exception as e:
                logger.error(f"HF Query Exception: {e}")
                return {"error": str(e)}

    async def describe_image(self, image_bytes):
        import base64
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "inputs": {
                "image": base64_image,
                "text": "Describe what you see in one warm, personal sentence."
            }
        }

        result = await self.query("vikhyatk/moondream2", payload)

        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "I see you.")
        elif isinstance(result, dict):
            if "generated_text" in result:
                return result["generated_text"]
            if "error" in result:
                logger.error(f"Moondream error: {result['error']}")

        return "I see you."

hf_client = HFClient()