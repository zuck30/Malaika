try:
    from fer import FER
except ImportError:
    from fer.fer import FER
import cv2
import numpy as np
import base64
from app.core.ai_models.hf_client import hf_client

class EmotionEngine:
    def __init__(self):
        self.detector = FER(mtcnn=True)

    def analyze_face(self, image_bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        
        emotions = self.detector.detect_emotions(img)
        if emotions:
            # Get the top emotion from the first detected face
            return emotions[0]["emotions"]
        return None

    async def analyze_text_emotion(self, text):
        # Using a more reliable zero-shot classification model
        model = "MoritzLaurer/DeBERTa-v3-base-mnli-xnli"
        candidate_labels = ["happy", "sad", "angry", "surprised", "neutral", "loving", "curious", "bored", "anxious", "confused"]
        payload = {
            "inputs": text,
            "parameters": {"candidate_labels": candidate_labels}
        }
        try:
            result = await hf_client.query(model, payload)
            if isinstance(result, dict) and "labels" in result and "scores" in result:
                return result["labels"][0]
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
        return "neutral"

emotion_engine = EmotionEngine()
