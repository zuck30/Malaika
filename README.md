# Elysia.

<p align="center">Elysia isn't just an assistant, she's a presence. Built for those who value both high-end design and neural performance, she brings a human touch to artificial intelligence. No sidebars, no clutter—just one immersive screen where classical beauty meets the edge of what's possible.</p>

![React](https://img.shields.io/badge/React-18.2.0-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104.0-009688) ![Mistral-7B](https://img.shields.io/badge/Mistral-7B-FFD21E) ![Moondream2](https://img.shields.io/badge/Moondream2-VLM-8A2BE2)

<h3>Quick Links</h3>

<div align="left">
    <a href="mailto:mwalyangashadrack.email@gmail.com"><img src="https://img.shields.io/badge/Contact%20Me-30302f?style=flat-square&logo=gmail" alt=""></a>
    <a href="https://github.com/zuck30/elysia-ai-companion.git"><img src="https://img.shields.io/badge/Repository-30302f?style=flat-square&logo=github" alt=""></a>
</div>

<br>
<ul>
    <li>👁️ <strong>Aware & Responsive:</strong> Using custom physics, Elysia maintains eye contact and tracks your movement</li>
    <li>🧠 <strong>Powered by Mistral-7B:</strong> Fine-tuned for emotionally intelligent conversation via Hugging Face</li>
    <li>👀 <strong>Visual Awareness:</strong> Built with Moondream2, Elysia sees through your eyes without camera previews</li>
    <li>🎭 <strong>Emotional Depth:</strong> Core shifts through living states based on conversation flow</li>
</ul>

<h2 id=lang>Tech Stack</h2>

**Frontend**

![My Skills](https://skillicons.dev/icons?i=react,ts,tailwind,js,html,css&perline=10)

**Backend**

![My Skills](https://skillicons.dev/icons?i=python,fastapi,docker&perline=10)

**ML & AI**

![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Mistral AI](https://img.shields.io/badge/Mistral-7B-2A6DF4?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==)

**Tools & Platforms**

![tools](https://skillicons.dev/icons?i=git,docker,github,vercel,apple,vscode&perline=10)

<h2> Quick Start</h2>

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (optional but recommended)
- Hugging Face API Token

### Installation & Setup

> *"Intelligence should be felt, not just read."*

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/zuck30/elysia-ai-companion.git
    cd elysia
    ```

2.  **Set Up Environment Variables**
    - Create a `.env` file in the root directory:
      ```env
      HUGGINGFACE_API_KEY=your_hugging_face_token_here
      # Add any additional configuration variables
      ```

3.  **Option A: Containerization (Recommended)**
    ```bash
    # Launch entire ecosystem - backend, frontend, and ChromaDB
    docker-compose up --build
    ```

4.  **Option B: Manual Installation**

    **The Nervous System (Backend)**
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000
    ```
    The backend API will be running at `http://127.0.0.1:8000`.

    **The Face (Frontend)**
    ```bash
    cd frontend
    npm install
    npm start
    ```
    The frontend application will open at `http://localhost:3000`.

### Deployment

#### 🚀 Backend (Render.com)
1.  **Create a New Web Service**: Choose the "Docker" runtime.
2.  **Root Directory**: Set this to `backend`.
3.  **Environment Variables**:
    - `HUGGINGFACE_API_KEY`: Your Hugging Face token.
    - `ALLOWED_ORIGINS`: Set to your Netlify URL (e.g., `https://your-site.netlify.app`) or `*` for all.
    - `PORT`: 8000 (optional, Render usually handles this).
4.  **Blueprint**: Alternatively, use the provided `render.yaml` file for automatic setup.

#### 🌐 Frontend (Netlify.com)
1.  **Create a New Site**: Connect your repository.
2.  **Base Directory**: `frontend`
3.  **Build Command**: `npm run build`
4.  **Publish Directory**: `build`
5.  **Environment Variables**:
    - `REACT_APP_API_URL`: Your backend URL (e.g., `https://elysia-backend.onrender.com`).
    - `REACT_APP_WS_URL`: Your backend WebSocket URL (e.g., `wss://elysia-backend.onrender.com`).

### Design Philosophy

I built Elysia on the principle of **Active Presence**. I believe software should feel alive. Her interface is designed to disappear into the background, leaving only a seamless connection between you and a machine that finally feels a bit more human.

<h2> TODO: </h2>
<h3>Enhance the Neural Architecture</h3>

- **Improved Eye Contact Physics**: Fine-tune head tracking and gaze response
- **Multi-modal Memory**: Implement ChromaDB for long-term conversation memory
- **Voice Synthesis Upgrade**: Lower latency STT with more emotive range
- **Expanded Vision Capabilities**: Fine-tune Moondream2 for better mood recognition
- **Mobile Optimization**: Adapt the immersive experience for smaller screens

<h2> Responsive Design</h2>

The application is optimized for all device sizes:
- Mobile phones (320px and up) 
- Tablets (768px and up)
- Laptops (1024px and up)
- Large screens (1200px and up)

<h2> Support the Project</h2>
<p>
    <a href="https://www.buymeacoffee.com/zuck30" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" height="30px" ></a>
</p>

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

If you have any questions or issues, please open an issue on GitHub or contact me at mwalyangashadrack@gmail.com

## Experience Elysia

I hope you enjoy connecting with an AI that finally feels a bit more human. Share your conversations and experiences with the community!

**Note**: Elysia is designed as an experimental AI companion. While emotionally intelligent, she remains an artificial intelligence and should be used as a tool for exploration and conversation.