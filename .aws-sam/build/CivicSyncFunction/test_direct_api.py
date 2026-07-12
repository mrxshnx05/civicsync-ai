from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).parent / ".env"

print("Loading:", env_path)

load_dotenv(env_path, override=True)

print("API KEY =", os.getenv("OPENROUTER_API_KEY"))