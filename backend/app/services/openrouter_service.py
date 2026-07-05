import os
import json
import requests
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
        self.model = os.getenv('OPENROUTER_MODEL', 'google/gemini-2.5-flash:free')
        self.demo_mode = os.getenv('DEMO_MODE', 'True').lower() == 'true'
        
        logger.info(f"🚀 OpenRouter Service initialized:")
        logger.info(f"   - Model: {self.model}")
        logger.info(f"   - Demo Mode: {self.demo_mode}")
        logger.info(f"   - API Key: {'✅ Configured' if self.api_key else '❌ Missing'}")
    
    def _call_api(self, messages: List[Dict], response_format: Optional[str] = None) -> Dict:
        """Make a call to OpenRouter API with demo mode support"""
        
        # ✅ DEMO MODE: Return mock data without API call
        if self.demo_mode:
            logger.info("🔧 DEMO MODE: Returning mock response")
            return self._get_demo_response(messages)
        
        if not self.api_key:
            logger.error("❌ No API key configured")
            return self._get_fallback_response("API key not configured")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://civicsync-ai.com",
                "X-Title": "CivicSync AI"
            }
            
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            if response_format:
                payload["response_format"] = {"type": "json_object"}
            
            logger.info(f"🔍 Calling OpenRouter API with model: {self.model}")
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                logger.info(f"✅ OpenRouter API response received")
                
                # Try to parse JSON
                try:
                    parsed = json.loads(content)
                    return parsed
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Response not valid JSON, trying to extract: {content[:100]}")
                    # Try to extract JSON from text
                    import re
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                    return self._get_fallback_response("Invalid JSON response")
                    
            else:
                logger.error(f"❌ OpenRouter API error: {response.status_code}")
                logger.error(f"Response: {response.text[:200]}")
                return self._get_fallback_response(f"API error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.error("❌ OpenRouter API timeout")
            return self._get_fallback_response("API timeout")
        except Exception as e:
            logger.error(f"❌ OpenRouter service error: {e}")
            return self._get_fallback_response(str(e))
    
    def _get_demo_response(self, messages: List[Dict]) -> Dict:
        """Generate mock responses for demo mode"""
        
        # Check what type of request this is based on messages
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        
        logger.info(f"📝 Demo mode analyzing: {user_message[:100]}...")
        
        # Detect issue type from user message
        user_lower = user_message.lower()
        
        # Default response
        response = {
            "category": "Other",
            "priority": "Medium",
            "confidence": 0.5,
            "suggested_department": "General Services",
            "estimated_resolution_hours": 48,
            "severity_score": 5,
            "summary": "Issue reported. Awaiting classification."
        }
        
        # Customize response based on content
        if "pothole" in user_lower or "road" in user_lower or "crack" in user_lower:
            response = {
                "category": "Pothole",
                "priority": "High",
                "confidence": 0.95,
                "suggested_department": "Roads & Infrastructure",
                "estimated_resolution_hours": 24,
                "severity_score": 8,
                "summary": "Pothole detected on road surface. Requires immediate attention to prevent vehicle damage and traffic hazards."
            }
        elif "garbage" in user_lower or "waste" in user_lower or "trash" in user_lower or "overflow" in user_lower:
            response = {
                "category": "Garbage_Overflow",
                "priority": "High",
                "confidence": 0.92,
                "suggested_department": "Sanitation Department",
                "estimated_resolution_hours": 12,
                "severity_score": 7,
                "summary": "Waste overflow detected. Requires immediate cleanup to prevent health hazards and environmental pollution."
            }
        elif "streetlight" in user_lower or "light" in user_lower or "dark" in user_lower:
            response = {
                "category": "Streetlight_Outage",
                "priority": "Medium",
                "confidence": 0.90,
                "suggested_department": "Electrical Department",
                "estimated_resolution_hours": 48,
                "severity_score": 6,
                "summary": "Streetlight outage reported. Affecting safety and visibility in the area. Needs prompt attention."
            }
        elif "water" in user_lower or "leak" in user_lower or "pipe" in user_lower:
            response = {
                "category": "Water_Leakage",
                "priority": "High",
                "confidence": 0.93,
                "suggested_department": "Water Supply Department",
                "estimated_resolution_hours": 18,
                "severity_score": 7,
                "summary": "Water leakage detected. Requires immediate attention to prevent water wastage and infrastructure damage."
            }
        elif "traffic" in user_lower or "signal" in user_lower:
            response = {
                "category": "Traffic_Signal_Issue",
                "priority": "Medium",
                "confidence": 0.88,
                "suggested_department": "Traffic Department",
                "estimated_resolution_hours": 36,
                "severity_score": 6,
                "summary": "Traffic signal issue reported. Affecting traffic flow and pedestrian safety. Needs timely resolution."
            }
        elif "tree" in user_lower or "branch" in user_lower:
            response = {
                "category": "Tree_Fall",
                "priority": "High",
                "confidence": 0.91,
                "suggested_department": "Parks & Gardens Department",
                "estimated_resolution_hours": 24,
                "severity_score": 7,
                "summary": "Tree/fallen branch reported. Requires immediate removal for public safety and traffic clearance."
            }
        elif "drain" in user_lower or "blockage" in user_lower or "sewage" in user_lower:
            response = {
                "category": "Drainage_Blockage",
                "priority": "High",
                "confidence": 0.94,
                "suggested_department": "Drainage Department",
                "estimated_resolution_hours": 12,
                "severity_score": 8,
                "summary": "Drainage blockage detected. Requires immediate clearing to prevent water logging and health hazards."
            }
        
        logger.info(f"📊 Demo classification: {response['category']} - {response['priority']}")
        return response
    
    def _get_fallback_response(self, error_message: str = "") -> Dict:
        """Fallback when API is unavailable"""
        logger.warning(f"⚠️ Using fallback response: {error_message}")
        return {
            "category": "Other",
            "priority": "Medium",
            "confidence": 0.3,
            "suggested_department": "General Services",
            "estimated_resolution_hours": 48,
            "severity_score": 3,
            "summary": f"Manual classification required. ({error_message})"
        }
    
    def classify_issue(self, title: str, description: str, location: str) -> Dict:
        """Classify a civic issue using OpenRouter"""
        
        combined_text = f"Title: {title}\nDescription: {description}\nLocation: {location}"
        logger.info(f"🔍 Classifying issue: {title[:50]}...")
        
        prompt = f"""
        You are a Smart City AI Assistant for CivicSync AI. Analyze the following civic issue:
        
        {combined_text}
        
        Provide a detailed analysis with the following JSON structure:
        {{
            "category": "One of: Pothole, Garbage_Overflow, Streetlight_Outage, Water_Leakage, Traffic_Signal_Issue, Tree_Fall, Drainage_Blockage, Other",
            "priority": "One of: High, Medium, Low",
            "confidence": 0.95,
            "suggested_department": "Which city department should handle this?",
            "estimated_resolution_hours": 24,
            "severity_score": 7,
            "summary": "A brief summary of the issue and recommended action"
        }}
        
        Respond ONLY with valid JSON. No other text.
        """
        
        messages = [
            {"role": "system", "content": "You are a Smart City AI Assistant. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        return self._call_api(messages, response_format="json")
    
    def get_parking_recommendation(self, latitude: float, longitude: float, preferences: Optional[str] = None) -> Dict:
        """Get AI-powered parking recommendations"""
        prompt = f"""
        You are a Smart City AI Assistant providing parking recommendations.
        
        Location: Latitude {latitude}, Longitude {longitude}
        User preferences: {preferences or 'None specified'}
        
        Provide recommendations with this JSON structure:
        {{
            "recommended_spots": [
                {{
                    "name": "Parking location name",
                    "distance_km": 0.5,
                    "estimated_cost": 50,
                    "available_spots": 3,
                    "rating": 4.5
                }}
            ],
            "tips": ["Tip 1", "Tip 2"],
            "estimated_arrival_time": "5 minutes"
        }}
        
        Respond ONLY with valid JSON. No other text.
        """
        
        messages = [
            {"role": "system", "content": "You are a Smart City AI Assistant. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        return self._call_api(messages, response_format="json")