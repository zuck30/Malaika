import asyncio
import os
import base64
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.vision_utils import encode_image_to_base64
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import pytest

@pytest.mark.asyncio
async def test_vision_completion():
    """
    Test the Qwen2.5-VL integration with a simple base64 image.
    Note: This requires a valid HF_TOKEN in the environment.
    """
    if not os.getenv("HF_TOKEN") and not os.getenv("HUGGINGFACE_API_KEY"):
        logger.error("Skipping test: HF_TOKEN or HUGGINGFACE_API_KEY not set")
        return

    # A tiny 1x1 black pixel JPEG in base64
    tiny_jpeg_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    image_url = f"data:image/png;base64,{tiny_jpeg_b64}"

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": "What color is this image?"}
            ]
        }
    ]

    logger.info("Sending test vision request to Qwen2.5-VL...")
    response = await hf_client.chat_completion(messages)
    logger.info(f"Response: {response}")
    assert response is not None
    assert len(response) > 0
    logger.info("Test PASSED")

if __name__ == "__main__":
    asyncio.run(test_vision_completion())
