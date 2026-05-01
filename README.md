

# Artificial Intelligence Companion that actually says things.

![Shot](screenshots/shot-1.png)



![Banner](https://capsule-render.vercel.app/api?type=venom&height=200&color=0:61DAFB,100:8A2BE2&text=Malaika&textBg=false&desc=(AI+Companion)&descAlign=79&fontAlign=50&descAlignY=70&fontColor=f7f5f5)

<p align="center">
Malaika isn't just a companion, she's a presence. Inspired by the minimalist elegance of "Her" my favorite movie, and the high energy aesthetic of modern social interfaces.
</p>

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104.0-009688?logo=fastapi) ![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-blue) ![Qwen2.5-VL](https://img.shields.io/badge/Qwen2.5--VL-Vision--Language-blueviolet)

<br>

<h2 id=lang>Tech Stack</h2>

**Frontend**

![technologies](https://skillicons.dev/icons?i=react,ts,threejs,tailwind,redux&perline=10)

**Backend**

![technologies](https://skillicons.dev/icons?i=python,fastapi,docker&perline=10)

**Tools & Platforms**

![technologies](https://skillicons.dev/icons?i=github,vscode,netlify&perline=10)

<h2> Quick Start</h2>

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Hugging Face API Token

## Project Structure

- `frontend/`: Contains the React application with TypeScript and Three.js 3D rendering.
- `backend/`: Contains the FastAPI backend with ChromaDB memory integration.

## Setup and Installation

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set your Hugging Face API key as an environment variable:
    ```bash
    export HF_TOKEN='your_huggingface_token'
    ```
4.  Run the backend server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required npm packages:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Start the React development server:
    ```bash
    npm start
    ```

### Docker Setup (Alternative)

1.  Run with Docker Compose:
    ```bash
    docker-compose up --build
    ```


## Features

- **Multi-modal Memory**: Integrated with ChromaDB for hybrid semantic/chronological retrieval of conversations.
- **Proactive Visual Awareness**: Powered by Qwen2.5-VL-7B-Instruct for high-fidelity visual and video context awareness.
- **Emotional Depth**: Dual-layered emotion engine analyzing facial expressions and message sentiment.
- **Natural Speech Synthesis**: Edge-TTS with natural prosody and conversational flow.

## Usage

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  Interact with Malaika through voice or text.
3.  **Clap your hands** to trigger a Jarvis-style greeting and start voice conversation!
4.  Experience a living, breathing AI companion.

## macOS Permissions & Setup

To allow Malaika to control your MacBook Pro (M3) or other macOS laptops, you must grant the following permissions:

1.  **Accessibility**: Required for controlling system volume, brightness, and window management via `osascript` and `Quartz`.
    - Go to `System Settings > Privacy & Security > Accessibility`.
    - Add and enable your Terminal (e.g., iTerm2 or Terminal.app) and/or your IDE (e.g., VS Code).
2.  **Screen Recording**: Required for the Vision module to capture frames for analysis.
    - Go to `System Settings > Privacy & Security > Screen Recording`.
    - Enable for your terminal/browser.
3.  **Microphone**: Required for voice interaction and clap detection.
    - Go to `System Settings > Privacy & Security > Microphone`.
    - Enable for your browser (Chrome/Safari) and Terminal.
4.  **Automation**: Ensure the terminal is allowed to control "System Events".
    - Usually prompted on first run; can be managed in `System Settings > Privacy & Security > Automation`.

## License

This project is licensed under the MIT License.

## Support

If you have any questions or issues, please open an issue on GitHub or contact mwalyangashadrack@gmail.com
