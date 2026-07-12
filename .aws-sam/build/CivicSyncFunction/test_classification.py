import os
import sys
import json
from dotenv import load_dotenv

# Force load .env
load_dotenv(override=True)

# Debug: Check if key is loaded
api_key = os.getenv('OPENROUTER_API_KEY')
print(f"🔑 API Key found: {api_key[:20]}..." if api_key else "❌ API Key NOT found!")

if not api_key:
    print("❌ Please add OPENROUTER_API_KEY to your .env file")
    sys.exit(1)

# Import service
from app.services.openrouter_service import OpenRouterService

def test_classification():
    print("🚀 Testing OpenRouter Classification...")
    
    ai = OpenRouterService()
    
    # Test issue 1: Pothole
    print("\n📝 Test 1: Pothole on Main Street")
    result = ai.classify_issue(
        title="Large pothole on Main Street",
        description="There's a deep pothole near the city center that's damaging car tires",
        location="Main Street, City Center"
    )
    print(f"Category: {result.get('category')}")
    print(f"Priority: {result.get('priority')}")
    print(f"Department: {result.get('suggested_department')}")
    print(f"Confidence: {result.get('confidence')}")
    print(f"Summary: {result.get('summary')}")
    
    print("\n✅ Testing complete!")

if __name__ == "__main__":
    test_classification()