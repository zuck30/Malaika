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
                "rate": "+5%",
                "pitch": "+0Hz",
                "volume": "+0%"
            }
        }
        self.output_dir = "temp_audio"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def _process_samantha_text(self, text: str, mood: str = "samantha") -> str:
        if not text: return text
        
        # 1. Strip markdown and asterisks (e.g., *laughs*, **bold**)
        # Using a more aggressive regex for nested or trailing asterisks
        processed = re.sub(r'\*+.*?\*+', '', text)
        processed = processed.replace('**', '')

        # 2. Strip brackets and parentheses containing descriptions
        processed = re.sub(r'\[.*?\]', '', processed)
        processed = re.sub(r'\(.*?\)', '', processed)

        # 3. Handle specific punctuation that causes reading glitches
        processed = processed.replace(" - ", "... ")
        processed = processed.replace(" -- ", "... ")
        processed = processed.replace(":", "...")

        # Collapse whitespace before natural processing
        processed = re.sub(r'\s+', ' ', processed)

        # 4. Natural "talking" processing
        # We want subtle pauses, not long silences
        processed = processed.replace(", ", ", ") # Keep commas natural

        # Add conversational fillers sparingly to make it sound less like "reading"
        if len(processed) > 40 and random.random() > 0.85:
            prefix = random.choice(["So...", "I mean...", "Actually...", "Honestly... "])
            processed = prefix + processed
            
        processed = processed.replace(". ", ". ") # AvaNeural handles periods well

        # Remove any remaining non-alphanumeric except basic punctuation
        processed = re.sub(r'[^\w\s\.,!\?\']', '', processed)

        return processed.strip()

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

tts_engine = TTSEngine()