import os
from dotenv import load_dotenv
from app.database import DatabaseService

load_dotenv(override=True)

def test_db_service():
    print("Testing Database Service...")
    
    # Initialize service
    db = DatabaseService()
    
    if not db.is_connected():
        print("❌ Database not connected")
        return
    
    print("✅ Database connected")
    
    # Test save
    test_report = {
        "id": "TEST001",
        "title": "Test Report",
        "description": "This is a test",
        "location": "Test Location",
        "category": "Test",
        "priority": "Medium",
        "confidence": 0.8,
        "status": "Open",
        "created_at": "2026-07-04T22:00:00"
    }
    
    try:
        db.save_report(test_report)
        print("✅ Report saved successfully")
        
        # Test get all
        reports = db.get_all_reports()
        print(f"✅ Retrieved {len(reports)} reports")
        
        # Find our test report
        found = False
        for r in reports:
            if r.get('id') == 'TEST001':
                found = True
                print(f"✅ Test report found: {r['title']}")
                break
        
        if not found:
            print("⚠️ Test report not found in all reports")
        
        # Clean up
        db.delete_report('TEST001')
        print("✅ Test report deleted")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_db_service()