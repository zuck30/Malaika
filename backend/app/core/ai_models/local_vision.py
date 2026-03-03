import logging
import base64
from PIL import Image
import io
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

logger = logging.getLogger(__name__)

class LocalVisionClient:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self._load_model()
    
    def _load_model(self):
        """Load Moondream2 model locally."""
        try:
            logger.info(f"Loading Moondream2 on {self.device}...")
            
            model_id = "vikhyatk/moondream2"
            revision = "2024-03-06"
            
            self.tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_id,
                revision=revision,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "mps" else torch.float32
            ).to(self.device)
            
            self.model.eval()
            logger.info(f"✅ Moondream2 loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load vision model: {e}")
            raise
    
    def analyze_image(self, image_bytes: bytes) -> str:
        """
        Analyze image locally using Moondream2.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            enc_image = self.model.encode_image(image)
            
            description = self.model.answer_question(
                enc_image, 
                "Describe what you see in detail. Be specific about objects, food, people, and activities.",
                self.tokenizer
            )
            
            logger.info(f"Local vision: {description}")
            return description
            
        except Exception as e:
            logger.error(f"Local vision analysis failed: {e}")
            return "I see you there, but I'm having trouble making out the details."

local_vision_client = LocalVisionClient()