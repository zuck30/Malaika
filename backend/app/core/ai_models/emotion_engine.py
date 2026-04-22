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
        # Using a more reliable and smaller model for sentiment/emotion
        model = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        payload = {"inputs": text}
        try:
            result = await hf_client.query(model, payload)
            # Result is usually a list of lists of dicts: [[{'label': 'positive', 'score': 0.9}, ...]]
            if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
                top_sentiment = result[0][0]['label']
                mapping = {
                    "positive": "happy",
                    "neutral": "neutral",
                    "negative": "sad"
                }
                return mapping.get(top_sentiment, "neutral")
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
        return "neutral"

emotion_engine = EmotionEngine()
