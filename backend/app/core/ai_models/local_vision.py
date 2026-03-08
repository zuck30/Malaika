import logging
import io
import torch
import asyncio
from PIL import Image
from functools import partial
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoConfig

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
        """
        try:
            logger.info(f"Loading Moondream2 on {self.device}...")

            model_id = "vikhyatk/moondream2"
            revision = "2024-03-06"

            # 1. Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                revision=revision,
                trust_remote_code=True
            )

            # 2. Load the configuration (outer Moondream2 config)
            config = AutoConfig.from_pretrained(
                model_id,
                revision=revision,
                trust_remote_code=True
            )

            # 3. Determine a safe pad_token_id
            eos_id = getattr(self.tokenizer, "eos_token_id", 0)
            if eos_id is None:
                eos_id = 0

            # 4. Locate the inner text model config (PhiConfig)
            text_config = None

            # Common attribute names for the text model
            for candidate in ["text_config", "language_model", "phi_config"]:
                if hasattr(config, candidate):
                    text_config = getattr(config, candidate)
                    logger.info(f"Found text_config via '{candidate}', type: {type(text_config)}")
                    break

            # If not found, scan all attributes
            if text_config is None:
                for attr_name in dir(config):
                    if attr_name.startswith("_"):
                        continue
                    attr = getattr(config, attr_name)
                    # Check class name or dict with model_type="phi"
                    if hasattr(attr, "__class__") and "PhiConfig" in attr.__class__.__name__:
                        text_config = attr
                        logger.info(f"Found text_config via class name in '{attr_name}', type: {type(attr)}")
                        break
                    elif isinstance(attr, dict) and attr.get("model_type") == "phi":
                        text_config = attr
                        logger.info(f"Found text_config as dict in '{attr_name}'")
                        break

            # 5. Apply fixes to the text config (if found)
            if text_config is not None:
                # Fix pad_token_id
                if isinstance(text_config, dict):
                    text_config["pad_token_id"] = eos_id
                    logger.info(f"Set pad_token_id={eos_id} in text_config dict")
                else:
                    try:
                        setattr(text_config, "pad_token_id", eos_id)
                        logger.info(f"Set pad_token_id={eos_id} on text_config object")
                    except AttributeError:
                        logger.warning(f"Could not set pad_token_id on text_config (type: {type(text_config)})")

                # Fix rope_scaling (must be a dict with "type" key)
                rope_scaling = None
                if isinstance(text_config, dict):
                    rope_scaling = text_config.get("rope_scaling")
                else:
                    rope_scaling = getattr(text_config, "rope_scaling", None)

                if rope_scaling is not None:
                    # If rope_scaling is a string, convert to dict
                    if isinstance(rope_scaling, str):
                        fixed_rope = {"type": rope_scaling}
                        logger.info(f"Converting rope_scaling from string '{rope_scaling}' to dict")
                        if isinstance(text_config, dict):
                            text_config["rope_scaling"] = fixed_rope
                        else:
                            setattr(text_config, "rope_scaling", fixed_rope)
                    # If it's already a dict, ensure it has "type"
                    elif isinstance(rope_scaling, dict) and "type" not in rope_scaling:
                        # This case is unlikely, but handle gracefully
                        rope_scaling["type"] = "linear"  # default
                        logger.info("Added missing 'type' key to rope_scaling dict")
            else:
                logger.warning("Could not locate inner text config; fixes may not be applied.")

            # 6. Load the model with the modified config
            self.model = AutoModelForCausalLM.from_pretrained(
                model_id,
                config=config,
                revision=revision,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "mps" else torch.float32
            ).to(self.device)

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