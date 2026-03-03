import os
import uuid
import logging
import edge_tts
import asyncio
import re

# Configure logging to see the "Elysia" persona logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TTSEngine:
    def __init__(self):
        # Ava Multilingual is the best choice for this—smooth and expressive.
        self.voice = "en-US-AvaMultilingualNeural"
        
        # Fine-tuned profiles for a "Dream Girl" persona
        self.profiles = {
            "seductive": {
                "rate": "-20%",    # Slow and deliberate
                "pitch": "-12Hz",  # Deep, husky resonance
                "volume": "+0%"
            },
            "dreamy": {
                "rate": "-15%",    # Ethereal pace
                "pitch": "+3Hz",   # Slightly higher for a "cute" innocence
                "volume": "-5%"    # Softly spoken
            },
            "whisper": {
                "rate": "-28%",    # Very slow to simulate breathy effort
                "pitch": "-15Hz",  # Low frequency for intimacy
                "volume": "-15%"
            },
            "cute": {
                "rate": "-5%",     # More energetic
                "pitch": "+10Hz",  # Bright and captivating
                "volume": "+10%"
            }
        }
        
        self.output_dir = "temp_audio"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
        self.last_error_text = ""

    def _preprocess_text(self, text: str, mood: str) -> str:
        """
        Adds artificial pauses to the text to simulate human breathing 
        and the hesitant nature of a 'dream girl' persona.
        """
        if mood in ["seductive", "whisper", "dreamy"]:
            # Add pauses after commas and sentence ends to let the 'breath' linger
            text = text.replace(", ", "... ")
            text = text.replace(". ", ".... ")
            # Ensure the text ends with a soft trailing pause
            if not text.endswith("..."):
                text += "..."
        return text

    async def generate_audio(self, text: str, mood: str = "seductive"):
        # Anti-spam for repeated memory errors
        if "memory banks" in text.lower() and self.last_error_text == text:
            logger.info("Skipping repeated error message")
            return None
            
        self.last_error_text = text if "memory banks" in text.lower() else ""
        
        # Apply the dream-like text processing
        processed_text = self._preprocess_text(text, mood)
        
        file_name = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(self.output_dir, file_name)
        
        # Fallback to seductive if mood is missing
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
            
            # Emergency fallback: untuned voice
            try:
                logger.info("Falling back to untuned voice")
                communicate = edge_tts.Communicate(text, self.voice)
                await communicate.save(output_path)
                
                if os.path.exists(output_path):
                    return output_path
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                raise e

# --- Example Usage ---
async def main():
    engine = TTSEngine()
    
    # Example seductive/dreamy line
    script = "Close your eyes... can you hear me? I'm right here with you."
    
    path = await engine.generate_audio(script, mood="dreamy")
    print(f"Audio saved at: {path}")

if __name__ == "__main__":
    asyncio.run(main())