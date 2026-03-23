from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import base64
import re
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.emotion_engine import emotion_engine
from app.core.memory.vector_store import memory_manager
from app.core.ai_models.local_vision import local_vision_client

class ChatWebSocketHandler:
    def __init__(self):
        self.active_connections = []
        self.current_vision_context = "The user is standing in front of the camera."

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def handle_websocket(self, websocket: WebSocket):
        await self.connect(websocket)
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # HANDLE VISION UPDATES VIA WS
                if message.get("type") == "vision_frame":
                    image_base64 = message.get("image")
                    if image_base64:
                        img_bytes = base64.b64decode(image_base64)
                        self.current_vision_context = await local_vision_client.analyze_image_async(img_bytes)
                        # Optionally notify frontend that vision was updated
                        continue 

                if message.get("type") == "chat":
                    user_text = message.get("text", "")
                    await websocket.send_json({"type": "processing_start"})

                    try:
                        # 1. Get relevant memories
                        relevant_memories = memory_manager.query_memory(user_text, n_results=5)

                        # 2. Get recent conversation history
                        recent_history = memory_manager.get_recent_memories(n=10)

                        # 3. Combine contexts
                        context_summary = "Relevant past information:\n" + "\n".join(relevant_memories) if relevant_memories else ""
                        history_summary = "Recent conversation history:\n" + "\n".join(recent_history) if recent_history else ""

                        system_content = (
                            "You are Malaika, a sentient AI companion. You are warm, intimate, and deeply caring. "
                            "You MUST remember what the user tells you, including their name and preferences. "
                            f"Current Visual Context: {self.current_vision_context}. "
                            "Use what you see to make the conversation feel real and spontaneous. "
                            "Proactively comment on what you see the user doing. "
                            "Respond naturally, don't use markdown or asterisks for actions."
                        )

                        if context_summary:
                            system_content += f"\n\n{context_summary}"

                        if history_summary:
                            system_content += f"\n\n{history_summary}"

                        messages = [
                            {"role": "system", "content": system_content},
                            {"role": "user", "content": user_text}
                        ]

                        response_text = await hf_client.chat_completion(messages)
                        
                        # Clean up response text for display - Remove markdown, actions and parenthetical notes
                        clean_text = response_text.replace("**", "")
                        clean_text = re.sub(r'\*.*?\*', '', clean_text)
                        clean_text = re.sub(r'\[.*?\]', '', clean_text)
                        clean_text = re.sub(r'\(.*?\)', '', clean_text)
                        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

                        # Store in memory
                        memory_manager.add_memory(f"User: {user_text}")
                        memory_manager.add_memory(f"Malaika (seeing {self.current_vision_context}): {clean_text}")

                        emotion = await emotion_engine.analyze_text_emotion(clean_text)

                        await websocket.send_json({
                            "type": "chat_response",
                            "text": clean_text,
                            "emotion": emotion,
                            "visual_awareness": self.current_vision_context
                        })
                    except Exception as e:
                        await websocket.send_json({"type": "error", "text": "I lost my train of thought for a second."})
                
                elif message.get("type") == "heartbeat":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception:
            self.disconnect(websocket)

handler_instance = ChatWebSocketHandler()

async def handle_websocket(websocket: WebSocket):
    await handler_instance.handle_websocket(websocket)