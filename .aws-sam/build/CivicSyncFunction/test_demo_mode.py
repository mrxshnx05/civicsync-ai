import os
from dotenv import load_dotenv
from app.services.openrouter_service import OpenRouterService

load_dotenv()

# Set demo mode for testing
os.environ['DEMO_MODE'] = 'True'

print("🚀 Testing OpenRouter Service with Demo Mode")
print("="*50)

ai = OpenRouterService()

# Test classification
result = ai.classify_issue(
    title="Large pothole on Main Street",
    description="There's a deep pothole near the city center that's damaging car tires",
    location="Main Street, City Center"
)

print("\n📝 Classification Result:")
print(f"Category: {result['category']}")
print(f"Priority: {result['priority']}")
print(f"Department: {result['suggested_department']}")
print(f"Summary: {result['summary']}")
print(f"Demo Mode: {result.get('_demo', False)}")

print("\n✅ Test complete!")