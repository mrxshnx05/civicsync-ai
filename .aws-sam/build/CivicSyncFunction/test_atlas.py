import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env file
load_dotenv(override=True)

def test_connection():
    # Get connection string
    uri = os.getenv('MONGODB_URI')
    
    if not uri:
        print("❌ ERROR: MONGODB_URI not found in .env")
        print("\nPlease add to backend/.env:")
        print("MONGODB_URI=mongodb+srv://civicsync_admin:YOUR_PASSWORD@...")
        return
    
    # Mask password for security
    masked_uri = uri
    try:
        parts = uri.split('://')
        if len(parts) > 1:
            auth_part = parts[1].split('@')[0]
            if ':' in auth_part:
                user, pwd = auth_part.split(':')
                masked_uri = parts[0] + '://' + user + ':****@' + parts[1].split('@')[1]
    except:
        masked_uri = uri[:30] + '...'
    
    print(f"🔑 Using connection string: {masked_uri}")
    
    try:
        # Connect to MongoDB Atlas
        print("⏳ Connecting to MongoDB Atlas...")
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Ping to verify connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Get database
        db = client['civicsync']
        print("✅ Database 'civicsync' ready")
        
        # Test write
        print("⏳ Testing write operation...")
        collection = db['test']
        result = collection.insert_one({
            'test': 'connection_success',
            'timestamp': '2026-07-04',
            'message': 'Hello from CivicSync AI!'
        })
        print(f"✅ Document inserted with ID: {result.inserted_id}")
        
        # Test read
        print("⏳ Testing read operation...")
        doc = collection.find_one({'test': 'connection_success'})
        if doc:
            print(f"✅ Document found: {doc['message']}")
        else:
            print("❌ Document not found")
        
        # Clean up
        collection.drop()
        print("✅ Cleanup complete")
        
        print("\n" + "="*50)
        print("🎉 MongoDB Atlas is ready for CivicSync AI!")
        print("="*50)
        print("\nYou can now start your backend:")
        print("  cd backend")
        print("  python app/main.py")
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check username/password in connection string")
        print("2. Verify IP is whitelisted (Network Access tab)")
        print("3. Check cluster status (should say 'Active')")

if __name__ == "__main__":
    test_connection()