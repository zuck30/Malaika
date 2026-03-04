import io
import logging
from PIL import Image
import base64

logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = (1024, 1024)
MAX_FILE_SIZE_MB = 5

def validate_and_process_image(image_data) -> bytes:
    """
    Validates image size and format, converts to JPEG, and returns bytes.
    Handles raw bytes, base64 strings, and BytesIO.
    """
    try:
        if isinstance(image_data, io.BytesIO):
            image_data.seek(0)
            image_bytes = image_data.read()
        elif isinstance(image_data, str):
            if "," in image_data:
                image_data = image_data.split(",")[1]
            image_bytes = base64.b64decode(image_data)
        else:
            image_bytes = image_data

        # Check file size
        if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
            logger.warning(f"Image too large: {len(image_bytes)} bytes")
            # We could resize it instead of failing

        image = Image.open(io.BytesIO(image_bytes))

        # Handle formats like WebP or HEIC if PIL supports them (HEIC usually needs extra libs, but WebP is supported)
        if image.format not in ['JPEG', 'PNG', 'WEBP']:
             logger.info(f"Converting image from {image.format} to JPEG")

        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize if too large
        if image.width > MAX_IMAGE_SIZE[0] or image.height > MAX_IMAGE_SIZE[1]:
            logger.info(f"Resizing image from {image.size} to {MAX_IMAGE_SIZE}")
            image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)

        # Convert to JPEG bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        return img_byte_arr.getvalue()

    except Exception as e:
        logger.error(f"Image validation/processing failed: {e}")
        raise ValueError(f"Invalid image: {e}")
