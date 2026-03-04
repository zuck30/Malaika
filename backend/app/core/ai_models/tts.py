import os
import uuid
import logging
import edge_tts
import asyncio
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TTSEngine:
    def __init__(self):
        self.voice = "en-US-AvaMultilingualNeural"
        
        self.profiles = {
            "seductive": {
                "rate": "+0%",
                "pitch": "-12Hz",
                "volume": "+0%"
            },
            "dreamy": {
                "rate": "+5%",
                "pitch": "+3Hz",
                "volume": "-5%"
            },
            "whisper": {
                "rate": "-10%",
                "pitch": "-15Hz",
                "volume": "-15%"
            },
            "cute": {
                "rate": "+10%",
                "pitch": "+10Hz",
                "volume": "+10%"
            }
        }
        
        self.output_dir = "temp_audio"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
        self.last_error_text = ""

    def _preprocess_text(self, text: str, mood: str) -> str:
        # Reduced padding/pauses for better pace
        if mood in ["seductive", "whisper", "dreamy"]:
            text = text.replace(", ", ". ")
            text = text.replace(". ", ". ")
        return text

    async def generate_audio(self, text: str, mood: str = "seductive"):
        if "memory banks" in text.lower() and self.last_error_text == text:
            logger.info("Skipping repeated error message")
            return None
            
        self.last_error_text = text if "memory banks" in text.lower() else ""
        
        processed_text = self._preprocess_text(text, mood)
        
        file_name = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(self.output_dir, file_name)
        
        profile = self.profiles.get(mood, self.profiles["seductive"])
        
        try:
            logger.info(f"✨ Elysia {mood.upper()} mode activated")
            logger.info(f"   Tuning: rate={profile['rate']}, pitch={profile['pitch']}, volume={profile['volume']}")
            
            communicate = edge_tts.Communicate(
                processed_text, 
                self.voice,
                rate=profile["rate"],
                pitch=profile["pitch"],
                volume=profile["volume"]
            )
            
            await communicate.save(output_path)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                logger.info(f"Successfully generated {mood} voice file.")
                return output_path
            else:
                raise Exception("Generated file is empty")
                
        except Exception as e:
            logger.error(f"Failed with tuning: {e}")
            
            try:
                logger.info("Falling back to untuned voice")
                communicate = edge_tts.Communicate(text, self.voice)
                await communicate.save(output_path)
                
                if os.path.exists(output_path):
                    return output_path
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                raise e

# Create the singleton instance for import
tts_engine = TTSEngine()