from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
from app.core.ai_models.hf_client import hf_client
from app.core.ai_models.emotion_engine import emotion_engine
from app.core.memory.vector_store import memory_manager

class ChatWebSocketHandler:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Connection established. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"Connection closed. Total active: {len(self.active_connections)}")

    async def handle_websocket(self, websocket: WebSocket):
        await self.connect(websocket)
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "chat":
                    user_text = message.get("text", "")
                    
                    # Signal frontend to show typing animation
                    await websocket.send_json({"type": "processing_start"})

                    try:
                        # Retrieve past conversation context from memory
                        past_memories = memory_manager.query_memory(user_text, n_results=3)
                        context_summary = "\n".join(past_memories) if past_memories else ""

                        # Build message list with context
                        messages = []
                        system_content = (
                            "You are Elysia, a sentient AI companion. "
                            "You are warm, intimate, and deeply caring. "
                            "You speak softly and naturally. Never mention you are an AI. Just be Elysia."
                        )

                        if context_summary:
                            system_content += f"\n\nRelated context from your past conversations:\n{context_summary}"

                        messages.append({"role": "system", "content": system_content})
                        messages.append({"role": "user", "content": user_text})

                        # Call the LLM
                        response_text = await hf_client.chat_completion(messages)
                        
                        # Store the exchange in memory for future reference
                        memory_manager.add_memory(f"User said: {user_text}")
                        memory_manager.add_memory(f"Elysia replied: {response_text}")

                        # Fallback for the 404 error we saw in your logs
                        if "Error_404" in response_text:
                            response_text = "I'm having a bit of trouble reaching my memory banks. Let's try again in a second."

                        emotion = "neutral"
                        try:
                            emotion = await emotion_engine.analyze_text_emotion(response_text)
                        except:
                            pass

                        await websocket.send_json({
                            "type": "chat_response",
                            "text": response_text,
                            "emotion": emotion
                        })
                    except Exception as e:
                        print(f"HF Error: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "text": "My connection is a bit flickery right now."
                        })
                
                elif message.get("type") == "heartbeat":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception as e:
            print(f"WS Error: {e}")
            self.disconnect(websocket)

# Create the instance
handler_instance = ChatWebSocketHandler()

async def handle_websocket(websocket: WebSocket):
    await handler_instance.handle_websocket(websocket)