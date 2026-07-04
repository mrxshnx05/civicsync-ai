# backend/app/services/bedrock_service.py
import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        self.model_id = "anthropic.claude-v2"
    
    def classify_issue(self, title: str, description: str) -> dict:
        """Use Amazon Bedrock's Claude to classify civic issues"""
        try:
            prompt = f"""
            Human: You are a smart city AI. Classify this civic issue:
            
            Title: {title}
            Description: {description}
            
            Respond with JSON containing:
            - category (Pothole, Garbage, Water, etc.)
            - priority (High, Medium, Low)
            - confidence (0-1)
            
            Assistant: Here is my analysis:
            """
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType='application/json',
                accept='application/json',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 300,
                    "temperature": 0.1
                })
            )
            
            result = json.loads(response['body'].read())
            return json.loads(result['completion'])
            
        except Exception as e:
            print(f"Bedrock error: {e}")
            return {
                "category": "Other",
                "priority": "Medium",
                "confidence": 0.5
            }