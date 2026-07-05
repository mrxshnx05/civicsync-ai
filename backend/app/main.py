import os
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

# --- Configure Logging ---
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)

# --- Import Services ---
try:
    from app.services.openrouter_service import OpenRouterService
    ai_service = OpenRouterService()
    logger.info("✅ OpenRouter service initialized")
except Exception as e:
    logger.warning(f"⚠️ OpenRouter init failed: {e}")
    ai_service = None

try:
    from app.database import DatabaseService
    db_service = DatabaseService()
    logger.info("✅ Database service initialized")
except Exception as e:
    logger.warning(f"⚠️ Database init failed: {e}")
    db_service = None

# --- Initialize FastAPI App ---
app = FastAPI(
    title="CivicSync AI API",
    description="AI-Powered Smart Urban Resource Management Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Storage (Fallback) ---
reports_db: Dict[str, Dict[str, Any]] = {}
parking_spots_db = [
    {"id": 1, "location": "Main Street Parking", "is_available": True, "latitude": 12.9716, "longitude": 79.1589},
    {"id": 2, "location": "Market Road Parking", "is_available": False, "latitude": 12.9784, "longitude": 79.1650},
    {"id": 3, "location": "Temple Street Parking", "is_available": True, "latitude": 12.9650, "longitude": 79.1550},
]

# --- Pydantic Models ---
class ReportResponse(BaseModel):
    id: str
    title: str
    description: str
    location: str
    category: str
    priority: str
    confidence: float
    status: str
    created_at: str
    suggested_department: str
    estimated_resolution_hours: int
    severity_score: int
    user_email: Optional[str] = None
    image_url: Optional[str] = None

# --- Health Check ---
@app.get("/")
async def root():
    logger.debug("Root endpoint accessed")
    return {
        "project": "CivicSync AI",
        "version": "2.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint accessed")
    return {
        "status": "healthy",
        "openrouter": ai_service is not None,
        "database": db_service is not None and db_service.is_connected(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)

# --- Report Endpoints ---
@app.post("/api/reports", response_model=ReportResponse)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    user_email: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """Submit a new civic issue report"""
    try:
        logger.info(f"📝 Received report: {title}")
        logger.info(f"   Description: {description[:50]}..." if len(description) > 50 else f"   Description: {description}")
        logger.info(f"   Location: {location}")
        logger.info(f"   User email: {user_email or 'Not provided'}")
        logger.info(f"   Image: {image.filename if image else 'No image'}")
        
        report_id = str(uuid.uuid4())[:8]
        logger.info(f"📋 Generated report ID: {report_id}")
        
        # AI Classification (with fallback)
        try:
            if ai_service:
                logger.info("🤖 Calling AI service for classification...")
                ai_result = ai_service.classify_issue(title, description, location)
                logger.info(f"✅ AI Classification result: Category={ai_result.get('category')}, Priority={ai_result.get('priority')}")
            else:
                logger.warning("⚠️ AI service not available, using fallback")
                ai_result = {
                    "category": "Other",
                    "priority": "Medium",
                    "confidence": 0.5,
                    "suggested_department": "General Services",
                    "estimated_resolution_hours": 48,
                    "severity_score": 5,
                    "summary": "Manual classification required."
                }
        except Exception as e:
            logger.error(f"❌ AI classification error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            ai_result = {
                "category": "Other",
                "priority": "Medium",
                "confidence": 0.5,
                "suggested_department": "General Services",
                "estimated_resolution_hours": 48,
                "severity_score": 5,
                "summary": "Fallback classification."
            }
        
        # Create report
        report = {
            "id": report_id,
            "title": title,
            "description": description,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "category": ai_result.get("category", "Other"),
            "priority": ai_result.get("priority", "Medium"),
            "confidence": float(ai_result.get("confidence", 0.5)),
            "status": "Open",
            "created_at": datetime.now().isoformat(),
            "suggested_department": ai_result.get("suggested_department", "General Services"),
            "estimated_resolution_hours": int(ai_result.get("estimated_resolution_hours", 48)),
            "severity_score": int(ai_result.get("severity_score", 5)),
            "user_email": user_email,
            "image_url": None,
            "summary": ai_result.get("summary", "Issue reported. Awaiting classification.")  # ✅ ADD THIS
        }
        
        # Save to database or in-memory
        saved_to_db = False
        try:
            if db_service and db_service.is_connected():
                logger.info("💾 Saving to MongoDB...")
                db_service.save_report(report)
                logger.info(f"✅ Report saved to MongoDB: {report_id}")
                saved_to_db = True
            else:
                reports_db[report_id] = report
                logger.info(f"✅ Report saved in-memory: {report_id}")
        except Exception as e:
            logger.error(f"⚠️ Save error: {e}, using in-memory")
            reports_db[report_id] = report
        
        logger.info(f"🎉 Report {report_id} created successfully")
        return report
        
    except Exception as e:
        logger.error(f"❌ Error creating report: {e}")
        logger.error(f"   Type: {type(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
async def get_all_reports():
    """Get all reports"""
    try:
        logger.info("📋 Fetching all reports...")
        
        reports = []
        
        # Try MongoDB first
        if db_service and db_service.is_connected():
            try:
                reports = db_service.get_all_reports()
                if reports:
                    logger.info(f"✅ Retrieved {len(reports)} reports from MongoDB")
                else:
                    logger.info("📭 No reports in MongoDB, checking memory...")
                    reports = list(reports_db.values())
            except Exception as e:
                logger.error(f"❌ Error fetching from MongoDB: {e}")
                reports = list(reports_db.values())
        else:
            reports = list(reports_db.values())
            logger.info(f"✅ Retrieved {len(reports)} reports from memory")
        
        # Sort by priority
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        reports.sort(key=lambda x: priority_order.get(x.get("priority", "Medium"), 1))
        
        # Ensure all reports have required fields
        for report in reports:
            if 'ai_summary' not in report:
                report['ai_summary'] = report.get('summary', 'No summary available')
            if 'summary' not in report:
                report['summary'] = report.get('ai_summary', 'No summary available')
        
        return reports
        
    except Exception as e:
        logger.error(f"❌ Error fetching reports: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Return empty array instead of error
        return []

@app.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    """Get a specific report by ID"""
    try:
        logger.info(f"📋 Fetching report: {report_id}")
        
        if db_service and db_service.is_connected():
            try:
                report = db_service.get_report(report_id)
                if report:
                    logger.info(f"✅ Report {report_id} found in MongoDB")
                    return report
            except Exception as e:
                logger.error(f"❌ Error fetching from MongoDB: {e}")
        
        report = reports_db.get(report_id)
        if report:
            logger.info(f"✅ Report {report_id} found in memory")
            return report
        
        logger.warning(f"⚠️ Report {report_id} not found")
        raise HTTPException(status_code=404, detail="Report not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reports/{report_id}")
async def update_report_status(report_id: str, status: str):
    """Update report status"""
    try:
        logger.info(f"📋 Updating report {report_id} status to: {status}")
        allowed_statuses = ["Open", "In Progress", "Resolved", "Closed"]
        if status not in allowed_statuses:
            logger.warning(f"⚠️ Invalid status: {status}")
            raise HTTPException(status_code=400, detail="Invalid status")
        
        updated = False
        
        if db_service and db_service.is_connected():
            try:
                updated = db_service.update_status(report_id, status)
                if updated:
                    logger.info(f"✅ Report {report_id} status updated in MongoDB")
                    return {"message": "Status updated", "status": status}
            except Exception as e:
                logger.error(f"❌ Error updating in MongoDB: {e}")
        
        if report_id in reports_db:
            reports_db[report_id]["status"] = status
            updated = True
            logger.info(f"✅ Report {report_id} status updated in memory")
        
        if not updated:
            logger.warning(f"⚠️ Report {report_id} not found")
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {"message": "Status updated", "status": status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Parking Endpoints ---
@app.get("/api/parking")
async def get_parking_spots():
    """Get all parking spots"""
    logger.info("🅿️ Fetching parking spots")
    return parking_spots_db

@app.post("/api/parking/{spot_id}/book")
async def book_parking(spot_id: int):
    """Book a parking spot"""
    try:
        logger.info(f"🅿️ Booking parking spot: {spot_id}")
        for spot in parking_spots_db:
            if spot["id"] == spot_id:
                if spot["is_available"]:
                    spot["is_available"] = False
                    logger.info(f"✅ Parking spot {spot_id} booked successfully")
                    return {"message": "Parking spot booked successfully", "spot": spot}
                else:
                    logger.warning(f"⚠️ Parking spot {spot_id} already occupied")
                    raise HTTPException(status_code=400, detail="Parking spot already occupied")
        logger.warning(f"⚠️ Parking spot {spot_id} not found")
        raise HTTPException(status_code=404, detail="Parking spot not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error booking parking {spot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Stats Endpoint ---
@app.get("/api/stats")
async def get_stats():
    """Get platform statistics"""
    try:
        logger.info("📊 Fetching platform statistics")
        reports = []
        source = "memory"
        
        if db_service and db_service.is_connected():
            try:
                reports = db_service.get_all_reports()
                if reports:
                    source = "MongoDB"
                    logger.info(f"📊 Retrieved {len(reports)} reports from MongoDB")
                else:
                    reports = list(reports_db.values())
            except Exception as e:
                logger.error(f"❌ Error fetching from MongoDB: {e}")
                reports = list(reports_db.values())
        else:
            reports = list(reports_db.values())
        
        total = len(reports)
        high_priority = sum(1 for r in reports if r.get("priority") == "High")
        resolved = sum(1 for r in reports if r.get("status") in ["Resolved", "Closed"])
        open_reports = sum(1 for r in reports if r.get("status") == "Open")
        
        categories = {}
        for r in reports:
            cat = r.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + 1
        
        logger.info(f"📊 Stats from {source}: Total={total}, High={high_priority}, Resolved={resolved}")
        
        return {
            "total_reports": total,
            "high_priority": high_priority,
            "resolved": resolved,
            "open_reports": open_reports,
            "categories": categories,
            "platform_status": "active",
            "timestamp": datetime.now().isoformat(),
            "source": source
        }
    except Exception as e:
        logger.error(f"❌ Error fetching stats: {e}")
        return {
            "total_reports": len(reports_db),
            "high_priority": 0,
            "resolved": 0,
            "open_reports": len(reports_db),
            "categories": {},
            "platform_status": "active",
            "source": "memory"
        }

# --- Debug Endpoint ---
@app.get("/api/debug/db")
async def debug_db():
    """Debug endpoint to check database status"""
    return {
        "db_connected": db_service is not None and db_service.is_connected(),
        "db_service_exists": db_service is not None,
        "mongodb_uri": os.getenv('MONGODB_URI', 'Not set')[:50] + '...' if os.getenv('MONGODB_URI') else 'Not set',
        "memory_count": len(reports_db),
        "reports_in_memory": list(reports_db.keys())
    }

# --- Main Entry Point ---
if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting CivicSync AI Backend...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )