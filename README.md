# SEO Automation Tool

Full-stack SEO rank tracking platform built with FastAPI (Python) backend and React/Vite frontend.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Rank Providers**: SerpApi, DataForSEO, Mock (for dev)

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add SERPAPI_KEY, JWT_SECRET etc.

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

## Default Login

- **Admin**: admin@aventionseo.com / admin123
- **Manager**: manager@aventionseo.com / manager123

## Environment Variables (backend/.env)

```env
DATABASE_URL=sqlite:///./avention_seo.db
RANK_PROVIDER=serpapi
SERPAPI_KEY=your_serpapi_key_here
JWT_SECRET=your_secret_key_here
```
