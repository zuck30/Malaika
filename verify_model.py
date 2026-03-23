import os
import sys

def check_model_exists():
    model_path = "frontend/public/models/elysia_v3.glb"
    if os.path.exists(model_path):
        size = os.path.getsize(model_path)
        print(f"SUCCESS: Model found at {model_path} ({size} bytes)")
        return True
    else:
        print(f"ERROR: Model NOT found at {model_path}")
        return False

if __name__ == "__main__":
    if check_model_exists():
        sys.exit(0)
    else:
        sys.exit(1)
