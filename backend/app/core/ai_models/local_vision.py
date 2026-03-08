import logging
import io
import torch
import asyncio
from PIL import Image
from functools import partial
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoConfig
import transformers.modeling_utils

logger = logging.getLogger(__name__)

class LocalVisionClient:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self._load_model()

    def _load_model(self):
        """
        Load Moondream2 model locally with fixes for:
        - missing pad_token_id in PhiConfig
        - malformed rope_scaling (string instead of dict)
        - tied weights issues in newer transformers versions
        """
        try:
            logger.info(f"Loading Moondream2 on {self.device}...")

            model_id = "vikhyatk/moondream2"
            revision = "2024-03-06"

            #  Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                revision=revision,
                trust_remote_code=True
            )

            #  Determine a safe pad_token_id
            eos_id = getattr(self.tokenizer, "eos_token_id", 0)
            if eos_id is None:
                eos_id = 0

            # Apply a temporary monkeypatch to handle configuration quirks in remote code
            orig_init = transformers.modeling_utils.PreTrainedModel.__init__
            
            def patched_init(model_instance, config, *args, **kwargs):
                if config is not None:
                    # Fix rope_scaling: must be None or a dict with "type"
                    rs = getattr(config, "rope_scaling", None)
                    if rs is not None:
                        if not isinstance(rs, dict) or "type" not in rs:
                            try:
                                setattr(config, "rope_scaling", None)
                                logger.info("Monkeypatch: Fixed invalid rope_scaling in config")
                            except:
                                pass
                    
                    # Fix pad_token_id: many models expect it to be present
                    if not hasattr(config, "pad_token_id") or getattr(config, "pad_token_id") is None:
                        try:
                            setattr(config, "pad_token_id", eos_id)
                            logger.info(f"Monkeypatch: Set pad_token_id={eos_id} in config")
                        except:
                            pass
                            
                # Call the original __init__
                orig_init(model_instance, config, *args, **kwargs)
                
                # Fix for 'all_tied_weights_keys' missing which causes crashes in newer transformers
                # It should be a dict or a similar object with .keys() method
                if not hasattr(model_instance, "all_tied_weights_keys"):
                    model_instance.all_tied_weights_keys = {}

            # Apply monkeypatch
            transformers.modeling_utils.PreTrainedModel.__init__ = patched_init

            try:
                # Load the configuration
                config = AutoConfig.from_pretrained(
                    model_id,
                    revision=revision,
                    trust_remote_code=True
                )
                
                # Ensure _attn_implementation is set
                if not hasattr(config, "_attn_implementation"):
                    config._attn_implementation = "eager"

                # Load the model with the modified config and monkeypatch active
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_id,
                    config=config,
                    revision=revision,
                    trust_remote_code=True,
                    torch_dtype=torch.float16 if self.device == "mps" else torch.float32
                ).to(self.device)

            finally:
                # Restore original __init__
                transformers.modeling_utils.PreTrainedModel.__init__ = orig_init

            self.model.eval()
            logger.info(f"Moondream2 successfully loaded on {self.device}")

        except Exception as e:
            logger.error(f"Failed to load vision model: {e}")
            raise

    def analyze_image(self, image_bytes: bytes) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            with torch.no_grad():
                enc_image = self.model.encode_image(image)
                description = self.model.answer_question(
                    enc_image,
                    "Describe what you see in one short sentence.",
                    self.tokenizer
                )
            logger.info(f"Local vision result: {description}")
            return description
        except Exception as e:
            logger.error(f"Local vision analysis failed: {e}")
            return "I can see an image, but I'm having trouble processing the details right now."

    async def analyze_image_async(self, image_bytes: bytes) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(self.analyze_image, image_bytes)
        )

# Initialize the client for use in endpoints
local_vision_client = LocalVisionClient()
