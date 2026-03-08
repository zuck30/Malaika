import logging
import io
import torch
import asyncio
from PIL import Image
from functools import partial
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoConfig
import transformers.modeling_utils
import base64
import time

logger = logging.getLogger(__name__)

class LocalVisionClient:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self.last_error = None
        self.load_start_time = None
        self._load_model()

    def _load_model(self):
        """Load Moondream2 model locally"""
        try:
            self.load_start_time = time.time()
            logger.info(f"Loading Moondream2 on {self.device}...")

            model_id = "vikhyatk/moondream2"
            revision = "2024-03-06"

            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                revision=revision,
                trust_remote_code=True
            )

            eos_id = getattr(self.tokenizer, "eos_token_id", 0)
            if eos_id is None:
                eos_id = 0

            # Apply monkeypatch for config issues
            orig_init = transformers.modeling_utils.PreTrainedModel.__init__
            
            def patched_init(model_instance, config, *args, **kwargs):
                if config is not None:
                    rs = getattr(config, "rope_scaling", None)
                    if rs is not None:
                        if not isinstance(rs, dict) or "type" not in rs:
                            try:
                                setattr(config, "rope_scaling", None)
                                logger.info("Fixed invalid rope_scaling")
                            except:
                                pass
                    
                    if not hasattr(config, "pad_token_id") or getattr(config, "pad_token_id") is None:
                        try:
                            setattr(config, "pad_token_id", eos_id)
                            logger.info(f"Set pad_token_id={eos_id}")
                        except:
                            pass
                            
                orig_init(model_instance, config, *args, **kwargs)
                
                if not hasattr(model_instance, "all_tied_weights_keys"):
                    model_instance.all_tied_weights_keys = {}

            transformers.modeling_utils.PreTrainedModel.__init__ = patched_init

            try:
                config = AutoConfig.from_pretrained(
                    model_id,
                    revision=revision,
                    trust_remote_code=True
                )
                
                if not hasattr(config, "_attn_implementation"):
                    config._attn_implementation = "eager"

                self.model = AutoModelForCausalLM.from_pretrained(
                    model_id,
                    config=config,
                    revision=revision,
                    trust_remote_code=True,
                    torch_dtype=torch.float16 if self.device == "mps" else torch.float32
                ).to(self.device)

            finally:
                transformers.modeling_utils.PreTrainedModel.__init__ = orig_init

            self.model.eval()
            load_time = time.time() - self.load_start_time
            logger.info(f"Moondream2 loaded in {load_time:.2f}s on {self.device}")

        except Exception as e:
            logger.error(f"Failed to load vision model: {e}")

            self.model = None

    def validate_image(self, image_bytes: bytes) -> bool:
        """Validate if the image bytes are valid"""
        try:
            if not image_bytes or len(image_bytes) < 100:
                logger.warning(f"Image too small: {len(image_bytes) if image_bytes else 0} bytes")
                return False
            
            # Try to open with PIL
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            
            # Reopen after verify
            image = Image.open(io.BytesIO(image_bytes))
            
            # Check dimensions
            width, height = image.size
            if width < 20 or height < 20:
                logger.warning(f"Image dimensions too small: {width}x{height}")
                return False
                
            logger.info(f"Valid image: {width}x{height}, {len(image_bytes)} bytes")
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False

    def analyze_image(self, image_bytes: bytes) -> str:
        """Analyze image and return description"""
        # If model failed to load, return a default response
        if self.model is None:
            return "a person using their computer"
            
        try:
            # Validate image first
            if not self.validate_image(image_bytes):
                return "something unclear - the image is too dark or blurry"

            # Handle base64 if needed
            if isinstance(image_bytes, str):
                if image_bytes.startswith('data:image'):
                    image_bytes = image_bytes.split(',')[1]
                try:
                    image_bytes = base64.b64decode(image_bytes)
                except:
                    pass
            
            # Open and prepare image
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # Resize if too large (Moondream2 works best with certain sizes)
            max_size = 768
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Analyze with model
            with torch.no_grad():
                enc_image = self.model.encode_image(image)
                
                # Try different prompts for better results
                prompts = [
                    "Describe what you see in one short sentence. Focus on the person.",
                    "What is the person doing in this image?",
                    "Describe the scene briefly."
                ]
                
                for prompt in prompts:
                    description = self.model.answer_question(
                        enc_image,
                        prompt,
                        self.tokenizer
                    )
                    
                    if description and len(description) > 10:
                        logger.info(f"Vision result: {description}")
                        return description
            
            # Fallback
            return "a person sitting in front of a computer"
            
        except Exception as e:
            logger.error(f"Vision analysis failed: {e}", exc_info=True)
            self.last_error = str(e)
            return "someone I can't quite see clearly"

    async def analyze_image_async(self, image_bytes: bytes) -> str:
        """Async wrapper for analyze_image"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(self.analyze_image, image_bytes)
        )

# Initialize the client
try:
    local_vision_client = LocalVisionClient()
except Exception as e:
    logger.error(f"Failed to initialize vision client: {e}")
    local_vision_client = None