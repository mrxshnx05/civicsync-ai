import os
import pymongo
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId  # ✅ ADD THIS IMPORT

class DatabaseService:
    def __init__(self):
        self.uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.getenv('MONGODB_DATABASE', 'civicsync')
        self.client = None
        self.db = None
        self.reports_collection = None
        self.connect()
    
    def connect(self):
        try:
            self.client = pymongo.MongoClient(self.uri)
            self.db = self.client[self.db_name]
            self.reports_collection = self.db['reports']
            
            # Create indexes
            self.reports_collection.create_index([('priority', pymongo.DESCENDING)])
            self.reports_collection.create_index([('status', pymongo.ASCENDING)])
            self.reports_collection.create_index([('created_at', pymongo.DESCENDING)])
            
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            self.client = None
    
    def _convert_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to JSON-serializable format"""
        if doc is None:
            return None
        
        # Remove or convert _id
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
        return doc
    
    def _convert_docs(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert multiple MongoDB documents"""
        return [self._convert_doc(doc) for doc in docs] if docs else []
    
    def is_connected(self) -> bool:
        return self.client is not None
    
    def save_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        result = self.reports_collection.insert_one(report)
        # Return the report without _id (it will be added by MongoDB)
        report['_id'] = str(result.inserted_id)
        return report
    
    def get_all_reports(self) -> List[Dict[str, Any]]:
        """Get all reports with proper serialization"""
        try:
            docs = list(self.reports_collection.find())
            return self._convert_docs(docs)
        except Exception as e:
            print(f"Error fetching reports: {e}")
            return []
    
    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Get a single report by ID"""
        try:
            doc = self.reports_collection.find_one({'id': report_id})
            return self._convert_doc(doc)
        except Exception as e:
            print(f"Error fetching report: {e}")
            return None
    
    def update_status(self, report_id: str, status: str) -> bool:
        try:
            result = self.reports_collection.update_one(
                {'id': report_id},
                {'$set': {'status': status, 'updated_at': datetime.now().isoformat()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating report: {e}")
            return False
    
    def delete_report(self, report_id: str) -> bool:
        try:
            result = self.reports_collection.delete_one({'id': report_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting report: {e}")
            return False
    
    def get_reports_by_location(self, location: str) -> List[Dict[str, Any]]:
        """Get reports by location"""
        try:
            docs = list(self.reports_collection.find({'location': {'$regex': location, '$options': 'i'}}))
            return self._convert_docs(docs)
        except Exception as e:
            print(f"Error searching reports: {e}")
            return []
    
    def get_reports_by_priority(self, priority: str) -> List[Dict[str, Any]]:
        """Get reports by priority"""
        try:
            docs = list(self.reports_collection.find({'priority': priority}))
            return self._convert_docs(docs)
        except Exception as e:
            print(f"Error fetching reports by priority: {e}")
            return []
    
    def get_analytics(self) -> Dict[str, Any]:
        """Get analytics data"""
        try:
            total = self.reports_collection.count_documents({})
            high_priority = self.reports_collection.count_documents({'priority': 'High'})
            resolved = self.reports_collection.count_documents({'status': {'$in': ['Resolved', 'Closed']}})
            
            # Category aggregation
            pipeline = [
                {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            categories = list(self.reports_collection.aggregate(pipeline))
            
            return {
                'total': total,
                'high_priority': high_priority,
                'resolved': resolved,
                'categories': categories,
                'collection_size': total
            }
        except Exception as e:
            print(f"Error getting analytics: {e}")
            return {
                'total': 0,
                'high_priority': 0,
                'resolved': 0,
                'categories': [],
                'collection_size': 0
            }
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")