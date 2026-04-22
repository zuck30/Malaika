import io
import logging
from PIL import Image
import base64
import cv2
import numpy as np
import tempfile
import os

logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = (768, 768) # Adjusted for Qwen2.5-VL serverless payload limits
MAX_FILE_SIZE_MB = 10

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Converts image bytes to a base64 data URL."""
    base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_encoded}"

def validate_and_process_image(image_data) -> bytes:
    """
    Validates image size and format, converts to JPEG, and returns bytes.
    Handles raw bytes, base64 strings, and BytesIO.
    Resizes to a maximum of 768px on the longest side.
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

        # Use PIL to validate and convert to JPEG
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB (required for JPEG)
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize if too large
        if image.width > MAX_IMAGE_SIZE[0] or image.height > MAX_IMAGE_SIZE[1]:
            logger.info(f"Resizing image from {image.size} to {MAX_IMAGE_SIZE}")
            image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)

        # Convert to JPEG bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=80) # Lowered quality slightly for smaller payload
        return img_byte_arr.getvalue()

    except Exception as e:
        logger.error(f"Image validation/processing failed: {e}")
        raise ValueError(f"Invalid image: {e}")

def sample_frames_from_video(video_bytes: bytes, num_frames: int = 6) -> list[bytes]:
    """
    Samples a set of frames evenly distributed across the video duration.
    """
    temp_video = None
    frames = []
    try:
        # Create a temporary file to store video bytes for OpenCV
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(video_bytes)
            temp_video = tmp.name

        cap = cv2.VideoCapture(temp_video)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if total_frames <= 0:
            logger.warning("Could not determine total frames in video")
            return []

        # Calculate indices to sample
        indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)

        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)

                # Resize
                pil_img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)

                # Save to bytes
                buf = io.BytesIO()
                pil_img.save(buf, format="JPEG", quality=75)
                frames.append(buf.getvalue())

        cap.release()
        return frames
    except Exception as e:
        logger.error(f"Video frame sampling failed: {e}")
        return []
    finally:
        if temp_video and os.path.exists(temp_video):
            os.remove(temp_video)
