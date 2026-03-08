import os
import uuid
import logging
import edge_tts
import asyncio
import random
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TTSEngine:
    def __init__(self):
        self.samantha_voice = "en-US-AvaNeural"
        self.profiles = {
            "samantha": {
                "voice": "en-US-AvaNeural",
                "rate": "-10%",
                "pitch": "-5Hz",
                "volume": "+0%"
            }
        }
        self.output_dir = "temp_audio"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def _process_samantha_text(self, text: str, mood: str = "samantha") -> str:
        if not text: return text
        
        # Natural "talking" processing
        processed = text.replace(", ", "... ")
        fillers = ["mhm...", "well...", "you know... "]
        if len(processed) > 40 and random.random() > 0.5:
            processed = random.choice(fillers) + processed
            
        processed = re.sub(r'\breally\b', 'reallly', processed, flags=re.IGNORECASE)
        processed = processed.replace(". ", "... ")
        return processed

    async def generate_audio(self, text: str, mood: str = "samantha"):
        profile = self.profiles.get(mood, self.profiles["samantha"])
        processed_text = self._process_samantha_text(text, mood)
        file_name = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(self.output_dir, file_name)

        try:
            communicate = edge_tts.Communicate(
                processed_text, 
                profile["voice"], 
                rate=profile["rate"], 
                pitch=profile["pitch"]
            )
            await communicate.save(output_path)
            return output_path
        except Exception as e:
            logger.error(f"TTS Error: {e}")
            return None

# THIS IS THE MISSING LINE THAT CAUSED YOUR ERROR
tts_engine = TTSEngine()