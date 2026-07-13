import os
import sys
from dotenv import load_dotenv

load_dotenv(override=True)

# Add the app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import DatabaseService

def test_mongodb():
    print("🧪 Testing MongoDB Database Service...")
    
    db = DatabaseService()
    
    if not db.is_connected():
        print("❌ MongoDB not connected!")
        return
    
    print("✅ MongoDB connected")
    
    # Test save
    test_report = {
        "id": "TEST_001",
        "title": "Test Report",
        "description": "This is a test report",
        "location": "Test Location",
        "category": "Test",
        "priority": "Medium",
        "confidence": 0.8,
        "status": "Open",
        "created_at": "2026-07-04T22:00:00",
        "suggested_department": "Test Department",
        "estimated_resolution_hours": 24,
        "severity_score": 5
    }
    
    try:
        db.save_report(test_report)
        print("✅ Test report saved")
    except Exception as e:
        print(f"❌ Save failed: {e}")
        return
    
    # Test get all
    try:
        reports = db.get_all_reports()
        print(f"✅ Retrieved {len(reports)} reports")
        for r in reports[:2]:
            print(f"   - {r.get('title', 'No title')} (ID: {r.get('id', 'No ID')})")
            # Check if _id is properly converted
            if '_id' in r:
                print(f"     _id: {r['_id']} (type: {type(r['_id'])})")
    except Exception as e:
        print(f"❌ Get all failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Clean up
    try:
        db.delete_report("TEST_001")
        print("✅ Test report deleted")
    except Exception as e:
        print(f"❌ Delete failed: {e}")
    
    print("🧪 Test complete!")

if __name__ == "__main__":
    test_mongodb()