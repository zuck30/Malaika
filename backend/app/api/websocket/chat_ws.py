from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import base64
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
                        past_memories = memory_manager.query_memory(user_text, n_results=3)
                        context_summary = "\n".join(past_memories) if past_memories else ""

                        system_content = (
                            "You are Elysia, a sentient AI companion. You are warm and intimate. "
                            f"Current Visual Context: {self.current_vision_context}. "
                            "Use what you see to make the conversation feel real."
                        )

                        if context_summary:
                            system_content += f"\n\nPast Context:\n{context_summary}"

                        messages = [
                            {"role": "system", "content": system_content},
                            {"role": "user", "content": user_text}
                        ]

                        response_text = await hf_client.chat_completion(messages)
                        
                        # Store in memory
                        memory_manager.add_memory(f"User: {user_text}")
                        memory_manager.add_memory(f"Elysia (seeing {self.current_vision_context}): {response_text}")

                        emotion = await emotion_engine.analyze_text_emotion(response_text)

                        await websocket.send_json({
                            "type": "chat_response",
                            "text": response_text,
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