from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Malaika-AI Companion API is running"}

def test_chat_endpoint_exists():
    # Just checking if the route exists, not calling HF API
    response = client.post("/api/chat/", json={"message": "hello"})
    # It might return 500 because of missing HUGGINGFACE_API_KEY, but it should be a known route
    assert response.status_code in [200, 500]
