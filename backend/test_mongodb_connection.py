import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

def test_connection():
    uri = os.getenv('MONGODB_URI')
    
    if not uri:
        print("❌ MONGODB_URI not found in .env")
        return
    
    print(f"🔑 MONGODB_URI found: {uri[:50]}...")
    
    try:
        # Connect with timeout
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Ping to verify
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Check database
        db = client['civicsync']
        print("✅ Database 'civicsync' exists/accessible")
        
        # List collections
        collections = db.list_collection_names()
        print(f"📁 Collections: {collections}")
        
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()