# Campus Lost and Found 🔍

An intelligent, AI-powered Lost and Found platform tailored for college campuses. It combines computer vision feature extraction and semantic text matching into a hybrid scoring engine to automatically pair lost property reports with found items.

**Repository Link**: [https://github.com/Deetchansai/JARVIS-Lost-and-Found.git](https://github.com/Deetchansai/JARVIS-Lost-and-Found.git)

---

## 🏛️ Project Architecture

```
campus-lost-and-found/
├── .github/workflows/        # CI/CD automated pipeline workflows
├── backend/                  # Node.js + Express REST API backend
├── frontend/                 # React.js client web application
├── ai-module/                # Python FastAPI hybrid matching microservice
├── docs/                     # System architecture & technical documentation
├── .gitignore                # Global ignore configuration
└── README.md                 # Project root documentation
```

---

## 🚀 Quickstart Guide

### 1. AI Microservice Setup (`ai-module/`)
The AI module runs on Python 3.9+ using FastAPI for image vector extraction, text embeddings, and hybrid cosine similarity scoring.

```bash
cd ai-module
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Interactive API docs will be available at: `http://localhost:8000/docs`

---

### 2. Backend Server Setup (`backend/`)
The Node.js Express server handles authentication, item report persistence, match triggers, and notification dispatching.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The backend API server will run at: `http://localhost:5000`

---

### 3. Frontend Client Setup (`frontend/`)
The React application provides responsive UI flows for reporting lost/found items, reviewing potential matches, and managing user alerts.

```bash
cd frontend
npm install
npm start
```
The React dev server will open at: `http://localhost:3000`

---

## 🧠 Hybrid AI Matching Pipeline
1. **Visual Embedding (CLIP)**: Item photos are encoded with open-source `clip-ViT-B-32` into 512-d vectors.
2. **Text Semantic Matcher (MiniLM)**: Title, category, and descriptions are embedded with open-source `all-MiniLM-L6-v2`.
3. **Hybrid Scoring Engine**: Matches are computed via weighted fusion:
   $$\text{Score} = w_{\text{text}} \times S_{\text{text}} + w_{\text{image}} \times S_{\text{image}}$$
4. **Automated Notification**: High-confidence pairings trigger in-app alerts and notifications to both the owner and finder.

---

## 📄 Documentation
For detailed system flowcharts, database schemas, and API contracts, see [docs/architecture.md](docs/architecture.md).
