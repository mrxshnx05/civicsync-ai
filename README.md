# 🏙️ CivicSync AI - Smart Urban Resource Management Platform

### AI, IoT & Cloud-Powered Smart Urban Resource Management Platform

## 📌 Project Overview

**CivicSync AI** is a unified Urban Intelligence Platform that transforms reactive city operations into proactive, data-driven urban governance. Unlike existing solutions that treat civic issue management and parking as separate systems, CivicSync AI uniquely combines **citizen participation**, **continuous IoT sensing**, **AI-driven decision intelligence**, and **AWS cloud services** into a unified intelligent ecosystem.

The platform collects real-time data from citizen reports, IoT devices, and smart parking systems to perform AI-driven issue classification, duplicate detection, priority prediction, parking recommendations, and predictive urban analytics. Built on a modular AWS cloud architecture, it delivers secure data management, event-driven processing, scalable analytics, and resilient digital services.

> **"The best way to predict the future is to build it."**

---

## 🎯 Problem Statement

Urban governance remains largely **reactive** due to:

- ❌ Fragmented infrastructure management
- ❌ Disconnected data sources
- ❌ Limited real-time visibility across civic infrastructure
- ❌ Manual citizen reports with limited AI integration
- ❌ Delayed response times
- ❌ Inefficient resource utilization
- ❌ Reduced citizen trust

**Result:** Road damage, waste overflow, water leakages, faulty streetlights, and parking inefficiencies lead to increased operational costs, traffic congestion, and decreased quality of life.

---

## 💡 Solution

**CivicSync AI** provides a unified platform that:

|                Feature                  |                                 Description                                   |
|-----------------------------------------|-------------------------------------------------------------------------------|
| **📝 AI-Powered Issue Classification** | Automatically categorizes and prioritizes citizen reports using OpenRouter AI |
| **🅿️ Smart Parking System**            | Real-time parking availability with AI-powered recommendations                |
| **📊 Real-Time Dashboard**             | Live analytics and insights for municipal authorities                         |
| **📍 Interactive Map**                 | Visualize issues and parking spots on an interactive map                      |
| **🖼️ Image Upload**                    | Attach photos to reports for better context                                   |
| **🔔 Smart Notifications**             | Automatic status updates and alerts                                           |
| **📈 Predictive Analytics**            | AI-generated insights for proactive governance                                |
| **☁️ Cloud-Native Architecture**       | Scalable, serverless AWS infrastructure                                       |

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│           🌐 React Frontend (S3 Static Website)                    │
│              Dashboard | Report Form | Parking Map                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS / REST API
┌─────────────────────────────────▼───────────────────────────────────┐
│                    🔗 AWS API Gateway                              │
│                  (REST API Endpoints)                               │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                    ⚡ AWS Lambda (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🤖 AI Service Layer                                       │     │
│  │  ┌─────────────────┐    ┌─────────────────┐                 │    │
│  │  │  OpenRouter     │    │  Amazon Bedrock │                 │    │
│  │  │  (Primary)      │───▶│  (Fallback)     │                │    │
│  │  └─────────────────┘    └─────────────────┘                │     │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                         DATA LAYER                                 │
├───────────────┬───────────────────┬─────────────────────────────────┤
│ 📊 MongoDB    │ 🖼️ Amazon S3     │ 📈 Amazon Redshift              │
│   Atlas       │   (Images)        │   (Analytics - Future)          │
│   (Reports)   │                   │                                 │
└───────────────┴───────────────────┴─────────────────────────────────┘
```

### Technical Workflow

1. **Data Acquisition**: Citizen reports via web app + simulated IoT sensor data
2. **AI Processing**: Classification, priority prediction via OpenRouter/Bedrock
3. **Storage**: Reports stored in MongoDB Atlas, images in S3
4. **Analytics**: Real-time stats and AI-generated insights
5. **Presentation**: Dashboard, maps, and reports via React frontend

---

## 🛠️ Technology Stack

|           Layer          |           Technology          |              Purpose            |
|--------------------------|-------------------------------|---------------------------------|
| **Frontend**             | React.js 18 + Tailwind CSS    | User interface & styling        |
| **Backend**              | FastAPI (Python)              | REST API endpoints              |
| **AI/ML**                | OpenRouter (Gemini 2.5 Flash) | Issue classification & insights |
| **AI Fallback**          | Amazon Bedrock (Claude)       | Backup AI provider              |
| **Database**             | MongoDB Atlas                 | Report storage                  |
| **Image Storage**        | Amazon S3                     | User-uploaded images            |
| **Cloud Infrastructure** | AWS Lambda, API Gateway       | Serverless deployment           |
| **Deployment**           | Zappa, AWS Amplify            | CI/CD & hosting                 |

### Dependencies

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0
pymongo==4.6.1
motor==3.3.2
boto3==1.34.0
requests==2.31.0
mangum==0.17.0
zappa==0.58.0
```

---

## ✨ Key Features

### 1. AI Decision Intelligence
- **Issue Classification**: Automatically categorizes reports (Pothole, Garbage, Water Leakage, etc.)
- **Priority Prediction**: Assigns High/Medium/Low priority based on severity
- **Smart Routing**: Suggests appropriate department for resolution
- **Confidence Scoring**: AI confidence level for each classification
- **Fallback Mode**: Works even without API (demo mode)

### 2. Real-Time Urban Sensing
- **Citizen Reporting**: Easy-to-use web interface for reporting issues
- **IoT Simulation**: Mock IoT data for parking availability
- **Image Upload**: Attach photos to reports for better context
- **Location Tracking**: GPS coordinates for precise location

### 3. Cloud Intelligence Platform
- **Scalable Infrastructure**: Serverless AWS architecture
- **Secure Data Management**: MongoDB Atlas with authentication
- **Real-Time Analytics**: Live dashboard with statistics
- **Smart Parking**: Real-time availability with booking system

### 4. User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Maps**: Visualize issues and parking spots
- **Real-Time Updates**: Instant feedback on submissions
- **Transparent Tracking**: Track report status from submission to resolution

---

## 📋 Measurable Outcomes

|             Outcome             |                               Impact                               |
|---------------------------------|--------------------------------------------------------------------|
| **Proactive Urban Operations**  | Early issue detection, intelligent prioritization, faster response |
| **Enhanced Citizen Experience** | Unified reporting, transparent tracking, increased participation   |
| **Smart Mobility & Parking**    | Reduced congestion, optimized space utilization, fuel savings      |
| **Data-Driven Governance**      | Live analytics, predictive insights, informed policy decisions     |
| **Scalable Cloud Services**     | Secure, resilient, expandable infrastructure                       |

---

## 🚀 Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB Atlas account (free tier)
- AWS account (free tier)
- OpenRouter API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/mrxshnx05/civicsync-ai.git
cd civicsync-ai
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your credentials (see below)
```

#### Environment Variables

Create `.env` file in the `backend` folder:

```env
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.5-flash:free

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=civicsync

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=civicsync-images-yourname

# Demo Mode (Set to True for mock AI responses)
DEMO_MODE=True
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API URL
```

#### Frontend Environment

Create `.env` in the `frontend` folder:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Run Locally

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📖 Usage Guide

### 1. Submit a Report

1. Navigate to **"Report Issue"** page
2. Fill in:
   - **Title**: Brief description (e.g., "Large pothole on Main Street")
   - **Description**: Detailed explanation
   - **Location**: Address or landmark
   - **Email**: Optional (for updates)
   - **Photo**: Optional image attachment
3. Click **"Submit Report"**
4. AI automatically:
   - Classifies the issue
   - Assigns priority (High/Medium/Low)
   - Suggests the appropriate department

### 2. View Dashboard

1. Navigate to **"Dashboard"**
2. See:
   - Total reports count
   - High priority issues
   - Resolved reports
   - Category distribution
   - Recent reports

### 3. Find Parking

1. Navigate to **"Parking"**
2. View:
   - Available parking spots
   - Location on map
   - Book available spots

### 4. Track Reports

1. Navigate to **"All Reports"**
2. View all submitted reports
3. See status (Open/In Progress/Resolved)

---

## 🌐 Deployment

### Deploy Backend to AWS Lambda (Zappa)

```bash
cd backend
zappa deploy dev
```

### Deploy Frontend to S3

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name --acl public-read
```

### Deploy with AWS Amplify

1. Connect your GitHub repository
2. Configure build settings
3. Deploy automatically on push

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| POST | `/api/reports` | Submit report |
| GET | `/api/reports` | Get all reports |
| GET | `/api/reports/{id}` | Get single report |
| PUT | `/api/reports/{id}` | Update report status |
| GET | `/api/parking` | Get parking spots |
| POST | `/api/parking/{id}/book` | Book parking spot |
| GET | `/api/stats` | Get platform statistics |

---

## 👥 Team AstraMind

|      Role     |    Name   |                     Contribution                        |
|---------------|-----------|---------------------------------------------------------|
| **Team Lead** | Roshni M  | Project Management, Backend Development, AI Integration |
| **Developer** | Dharoun G | Frontend Development, UI/UX Design                      |
| **Developer** | A Yasmin  | Database Design, Testing, Documentation                 |

---

## 📈 Future Scope

- **Connected IoT Ecosystem**: Integrate real ESP32 sensors for smart parking, streetlights, waste bins
- **Intelligent AI Evolution**: Predictive maintenance, urban risk forecasting, anomaly detection
- **Smart City Integration**: GIS platforms, emergency services, digital payments
- **Regional & Multi-City Expansion**: Scale to multiple municipalities and campuses
- **Advanced Analytics**: Amazon Redshift for big data analytics
- **Mobile App**: Flutter-based mobile application

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Contact

For questions or collaboration:

- **Email**: mroshni2025@gmail.com
- **GitHub**: https://github.com/mrxshnx05/civicsync-ai

---

<p align="center">
  <strong>Building Smarter, Connected, and Sustainable Cities with AI, IoT & AWS Cloud</strong>
</p>
<p align="center">
  © 2026 CivicSync AI - Built for #INCLUDE 1.0 Hackathon
</p>
```