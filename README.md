# Malaika: A Sentient AI Companion

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.104.0-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector%20Store-blue" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Llama--3.2-HF%20Router-FFD21E" alt="Llama 3.2" />
  <img src="https://img.shields.io/badge/Moondream2-VLM-8A2BE2" alt="Moondream2" />
</p>

<p align="center">
  <strong>Malaika isn't just an assistant—she's a presence.</strong><br>
  Inspired by the minimalist elegance of "Her" and the high-energy aesthetic of modern social interfaces, Malaika combines a VRoid-powered 3D persona with a cutting-edge neural architecture. No sidebars, no clutter—just one immersive screen where classical beauty meets the edge of what's possible.
</p>

---

## 👁️ Features

- **Active Presence & 3D Interaction**: Using Three.js and VRM physics, Malaika maintains eye contact, tracks your movement, and features interactive mouse-tracking perspective transforms for a "living" feel.
- **Multi-modal Memory**: Integrated with **ChromaDB**, Malaika remembers your name, preferences, and past conversations using a hybrid semantic/chronological retrieval system.
- **Proactive Visual Awareness**: Powered by **Moondream2**, Malaika sees you through your camera. She can spontaneously comment on your environment or your expression via her "Invisible Vision" system.
- **Emotional Depth**: A dual-layered emotion engine analyzes both your facial expressions (FER) and message sentiment (BART) to shift Malaika's state and 3D morph targets in real-time.
- **Natural Speech Synthesis**: Leveraging **Edge-TTS** (AvaNeural), Malaika speaks with natural prosody, complete with conversational fillers and adjusted punctuation for a human-like flow.
- **Invisible Camera System**: Captures visual context without intrusive camera previews, preserving the immersive, character-centric layout.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **3D Engine**: @react-three/fiber & @react-three/drei
- **Animation**: Framer Motion (UI) & VRM Morph Targets (Character)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS (Glassmorphic UI, Snapchat-inspired "Bitmoji Blue" aesthetic)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: ChromaDB (Vector store for long-term memory)
- **Real-time**: WebSockets for low-latency chat and emotion updates
- **AI Integration**: Hugging Face Inference API (Unified Router)

### AI Models
- **LLM**: `Llama-3.2-1B-Instruct` & `Qwen2.5-1.5B-Instruct` (Sub-second response latency)
- **Vision**: `Moondream2` (Local VLM for visual description)
- **Emotion**: `BART-large-mnli` (Zero-shot classification) & `FER` (Facial Expression Recognition)
- **TTS**: `edge-tts` (Microsoft Ava Neural voice)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+ (Use `npm install --legacy-peer-deps`)
- Docker & Docker Compose
- Hugging Face API Token

### Installation

1. **Clone & Environment**
   ```bash
   git clone https://github.com/zuck30/Malaika-ai-companion.git
   cd Malaika
   cp .env.example .env # Add your HUGGINGFACE_API_KEY
   ```

2. **Run with Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```

3. **Manual Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. **Manual Frontend Setup**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm start
   ```

---

## 📂 Project Structure

- `/backend/app/api`: FastAPI routers for chat, vision, and websockets.
- `/backend/app/core/ai_models`: Clients for HF Router, Moondream2, and Edge-TTS.
- `/backend/app/core/memory`: ChromaDB integration for conversation history.
- `/frontend/src/components/Character`: 3D rendering and animation logic for `Malaika_v3.glb`.
- `/frontend/src/components/Chat`: Glassmorphic chat interface and auto-scrolling message area.

---

## 🌐 Deployment

### Backend (Render.com)
- Use the provided `render.yaml` Blueprint.
- Runtime: **Docker**.
- Environment Variables: `HUGGINGFACE_API_KEY`, `ALLOWED_ORIGINS`, `PORT`.

### Frontend (Netlify)
- Base Directory: `frontend`
- Build Command: `npm run build`
- Publish Directory: `build`
- Environment Variables: `REACT_APP_API_URL`, `REACT_APP_WS_URL`.

---

## 🎨 Design Philosophy: Active Presence
Malaika is designed to disappear into the background. There are no sidebars or complex menus. Her interface is a single, unified space where the character is the focus. We believe software shouldn't just be functional; it should feel *alive*.

---

## 🔮 TODO & Future Roadmap
- [ ] **Custom Character Creation**: Tools to import and configure your own VRoid/GLB models.
- [ ] **Enhanced Eye Contact Physics**: Refined head tracking for more natural gaze response.
- [ ] **Voice Synthesis Upgrade**: Even lower latency STT and expanded emotive range.
- [ ] **Mobile App**: Native iOS/Android experience for on-the-go companionship.

## 📄 License
This project is licensed under the MIT License.

## 🤝 Support
If you enjoy Malaika, consider supporting the project:
<a href="https://www.buymeacoffee.com/zuck30" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" height="40px" ></a>
