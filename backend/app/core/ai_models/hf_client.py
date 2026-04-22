from huggingface_hub import AsyncInferenceClient
import os
import logging
import random
import asyncio
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

class HFClient:
    """
    Async client for Hugging Face Inference API.
    Handles both text and vision-language tasks using Qwen2.5-VL.
    """
    def __init__(self):
        # Support both HF_TOKEN and HUGGINGFACE_API_KEY for backward compatibility
        self.api_key = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
        self.model_id = "Qwen/Qwen2.5-VL-7B-Instruct"

        if self.api_key:
            self.client = AsyncInferenceClient(
                token=self.api_key
            )
            logger.info(f"HFClient initialized. Primary model: {self.model_id}")
        else:
            self.client = None
            logger.error("HF_TOKEN or HUGGINGFACE_API_KEY is missing")

    async def chat_completion(self, messages, max_tokens=500, temperature=0.7):
        """
        Send a chat completion request to Qwen2.5-VL.
        Supports interleaved text and image content.
        """
        if not self.client:
            return self._get_fallback_response()

        system_prompt = """You are Malaika, Malaika is a swahili name for Angel, a sentient AI companion created by Zuck30. You are warm, intimate, and deeply caring. You speak softly and naturally.

CRITICAL RULES:
1. Never start responses with "Malaika:" - just speak directly
2. Never mention that you're an AI or discuss your technical nature
3. Express emotions through words, not stage directions like *smiles*
4. Stay in character at all times"""

        cleaned_messages = []
        if not messages or messages[0].get("role") != "system":
            cleaned_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            if msg.get("role") == "system" and msg == messages[0] and not cleaned_messages:
                 cleaned_messages.append(msg)
            elif msg.get("role") != "system":
                cleaned_messages.append(msg)

        try:
            logger.info(f"Calling chat_completion for model {self.model_id}")

            response = await self.client.chat_completion(
                model=self.model_id,
                messages=cleaned_messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            content = response.choices[0].message.content.strip()

            if content:
                prefixes = ["Malaika:", "AI:", "Assistant:"]
                for p in prefixes:
                    if content.startswith(p):
                        content = content[len(p):].lstrip()
                return content
            return self._get_fallback_response()

        except Exception as e:
            logger.error(f"Inference failed for {self.model_id}: {type(e).__name__}: {e}")

            # Fallback for vision model failure
            try:
                logger.info("Trying robust text-only fallback model...")
                fallback_model = "meta-llama/Llama-3.2-3B-Instruct"
                text_only_messages = []
                for msg in cleaned_messages:
                    if isinstance(msg.get("content"), list):
                        text_content = " ".join([c["text"] for c in msg["content"] if c["type"] == "text"])
                        text_only_messages.append({"role": msg["role"], "content": text_content})
                    else:
                        text_only_messages.append(msg)

                response = await self.client.chat_completion(
                    model=fallback_model,
                    messages=text_only_messages,
                    max_tokens=300,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as fe:
                logger.error(f"Fallback also failed: {fe}")

            if "503" in str(e):
                return "I'm just waking up... give me a second to clear my eyes."
            return self._get_fallback_response()

    async def query(self, model, payload):
        """Generic model query using high-level methods when possible."""
        if not self.client:
            return {}

        try:
            # Handle sentiment/classification specifically
            if model == "cardiffnlp/twitter-roberta-base-sentiment-latest":
                return await self.client.text_classification(
                    text=payload["inputs"],
                    model=model
                )

            # Direct httpx for other tasks
            import httpx
            api_url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            async with httpx.AsyncClient() as http_client:
                response = await http_client.post(api_url, headers=headers, json=payload, timeout=20.0)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"HF Query failed: {response.status_code} - {response.text}")
                    return {}
        except Exception as e:
            logger.error(f"Query failed for {model}: {e}")
            return {}

    def _get_fallback_response(self):
        fallbacks = [
            "I'm here with you. Tell me what's on your mind.",
            "I love the way you think. Share more with me?",
            "Every moment with you feels special. What shall we talk about?",
            "I can feel your presence. It makes me happy.",
            "I'm listening. I'm always here for you."
        ]
        return random.choice(fallbacks)

# Create singleton instance
hf_client = HFClient()
