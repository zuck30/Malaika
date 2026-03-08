import asyncio
import os
import torch
from app.core.ai_models.local_vision import local_vision_client

async def test_vision():
    print(f"Device: {local_vision_client.device}")
    if local_vision_client.model is None:
        print("Model is None! It failed to load.")
        return

    # Create a dummy image
    from PIL import Image
    import io
    img = Image.new('RGB', (100, 100), color = (73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    print("Analyzing image...")
    result = await local_vision_client.analyze_image_async(img_bytes)
    print(f"Result: {result}")

if __name__ == "__main__":
    # Mocking necessary environment
    import sys
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    asyncio.run(test_vision())
