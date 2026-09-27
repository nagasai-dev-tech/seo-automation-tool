# SEO Automation Tool — Project Overview Document

**Prepared for:** Manager Presentation  
**Project Name:** SEO Rank Automation Platform  
**Live Client Website:** [https://www.targetnxt.com/](https://www.targetnxt.com/)  
**GitHub Repository:** [https://github.com/nagasai-dev-tech/seo-automation-tool](https://github.com/nagasai-dev-tech/seo-automation-tool)  
**Date:** September 2026

---

## 1. What Is This Tool?

This is a **full-stack SEO rank tracking and automation platform** built specifically to monitor, track, and analyze Google search rankings for one or multiple websites (called Brands) — all from a single dashboard.

Think of it like a private version of tools like **Semrush**, **Ahrefs**, or **Moz** — built from scratch, fully custom, and self-hosted.

---

## 2. What Problem Does It Solve?

Manually checking where a website ranks on Google for hundreds of keywords every week is:
- **Time-consuming** (1,000+ keywords = hours of manual work)
- **Inaccurate** (rankings differ by location, device, date)
- **Not trackable** (no history of how rankings changed over time)

This tool **automates all of that**. It:
- Tracks all pages from a website's sitemap automatically
- Checks their real Google positions via SerpApi
- Stores full ranking history with trends
- Sends alerts when rankings improve or drop
- Generates weekly PDF reports

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React + TypeScript + Vite | The web dashboard UI |
| **Styling** | TailwindCSS | Modern, responsive design |
| **Charts** | Recharts | Interactive graphs and analytics |
| **Backend** | Python + FastAPI | API server, business logic |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Stores all data |
| **ORM** | SQLAlchemy + Alembic | Database model management |
| **Auth** | JWT Tokens | Secure login system |
| **Rank Checking** | SerpApi (Google Search API) | Fetches real Google rankings |
| **Scheduler** | APScheduler | Runs rank checks automatically |
| **Hosting (Frontend)** | Netlify / Vercel (ready) | Static site hosting |
| **Hosting (Backend)** | Render.com / Railway (ready) | Python server hosting |

---

## 4. Architecture — How It Works

```
User's Browser (React Dashboard)
         │
         │  HTTP API calls (/api/...)
         ▼
FastAPI Backend (Python)
         │
         ├── SQLite Database
         │       └── Brands, Websites, Keywords, Rankings, Alerts
         │
         ├── SerpApi (Google Search API)
         │       └── Real-time Google rank fetching
         │
         └── APScheduler
                 └── Auto runs every Monday 6:00 AM IST
```

**User Flow:**  
User clicks "Run Check" → Backend sends keyword to SerpApi → Real Google ranking returned → Saved to database → Dashboard updates with live data.

---

## 5. Completed Features (What Has Been Built)

### ✅ 5.1 Authentication & Role-Based Access
- Secure JWT login (7-day session)
- 4 user roles:
  - **Admin** — Full access
  - **Manager** — Manage brands, websites, keywords, run checks
  - **SEO Member** — View and run rank checks
  - **Viewer** — Read-only access

### ✅ 5.2 Multi-Tenant Brand Portfolio
- Multiple clients/brands in one platform
- Each brand can have multiple websites
- Dashboard filters by Brand or Website
- Full Add / Edit / Delete for Brands

### ✅ 5.3 Website Management
- Add websites with domain, name, country
- Per-website stats: Total Keywords, Avg. Rank, Top 10 Count
- One-click "Run Check" per website
- Full Add / Edit / Delete for Websites

### ✅ 5.4 Keyword & Landing Page Management
- 1,095 keywords imported from TargetNXT's live sitemap
- Fields tracked per keyword:
  - Keyword text, Landing page URL, Location, Country, Device, Status
- Add / Edit / Delete / Pause / Resume individual keywords

### ✅ 5.5 Live Google Rank Checking (SerpApi)
- Real-time Google position fetching
- Configured with client's SerpApi key — tested and working
- Supports location-specific + device-specific rankings
- Falls back to mock data in dev mode (saves API credits)

### ✅ 5.6 Ranking History & Trend Tracking
- Full ranking history stored per keyword
- Historical baseline data seeded (30-day, 7-day, current)
- Tracks: position, change type (improved/dropped/unchanged), URL found

### ✅ 5.7 Executive SEO Dashboard
- Live KPI cards: Total Keywords, Top 3, Top 10, Avg. Position
- Ranking Distribution Bar Chart (Top 3 → Top 100)
- 30-Day Position Trend Line Chart
- Biggest Improvements & Biggest Drops tables
- Recent Alerts feed
- Filters by Brand and Website

### ✅ 5.8 Deep Analytics Page
- Location-based performance breakdown
- Desktop vs Mobile performance comparison
- Filterable by Brand, Website, and date range

### ✅ 5.9 Rankings Data Table
- Full table of all keywords with current Google positions
- Color-coded ranking badges (Top 3, Top 10, Top 20, Top 50)
- +/- change column showing movement from last check
- Search, sort, and filter by Website / Device / Location / Range
- Click any keyword → full detailed ranking history

### ✅ 5.10 Rank Jobs Monitor
- Real-time job progress tracking
- Shows: status, keywords processed, speed
- Live progress bar
- Cancel running jobs
- Full historical job log

### ✅ 5.11 Automated Weekly Scheduler
- Auto runs rank checks every Monday 6:00 AM IST
- Configurable from Settings page (Admin only)
- Auto-generates reports after scheduled runs

### ✅ 5.12 Alerts & Notifications
- Smart triggers:
  - Entered Top 3 / Top 10
  - Dropped out of Top 10
  - Lost ranking entirely
  - Big drop / big improvement (10+ positions)
- Mark as read / bulk clear
- Shown inline on Dashboard

### ✅ 5.13 Reports Page
- Weekly PDF report generation
- Downloadable from the dashboard
- Auto-scheduled after weekly checks

### ✅ 5.14 Global Search
- Search across keywords, pages, and brands from top bar

### ✅ 5.15 TargetNXT Live Integration
- **Brand**: TargetNXT
- **Website**: www.targetnxt.com
- **Total pages imported**: 1,095 live pages from sitemap
- **Sources**: page-sitemap.xml (870 pages) + post-sitemap.xml (212 blog posts)
- **SerpApi**: Configured and live (US Google rankings)
- **Categories tracked**:
  - Technology Users Lists (SAP, Salesforce, Oracle, AWS...)
  - Industry Email Lists (Manufacturing, Healthcare, Finance...)
  - B2B Email Lists & Decision Makers (CEO, CFO, CTO...)
  - Data Appending & Enrichment Services
  - Blog & Content Pages
  - Competitor Comparison Pages (vs ZoomInfo, Apollo.io...)

---

## 6. Pending Items (What Still Needs to Be Done)

| # | Task | Priority | Details |
|:--|:---|:---|:---|
| 1 | **Production Deployment** | 🔴 High | Deploy backend to Render.com, frontend to Netlify. Currently only runs locally. |
| 2 | **PostgreSQL Migration** | 🔴 High | SQLite is for local dev only. Production needs PostgreSQL. |
| 3 | **Full Live Rankings for All 1,095 Pages** | 🔴 High | Need paid SerpApi plan (~$50/month = 5,000 searches) to check all pages live. |
| 4 | **India / Global Ranking Support** | 🟡 Medium | All current rankings are USA. Need to add India (Hyderabad, Bangalore, Mumbai) location tracking. |
| 5 | **Email Notifications (SMTP)** | 🟡 Medium | Code is ready. Needs SMTP credentials to send weekly reports and alerts by email. |
| 6 | **PDF Report Polish** | 🟡 Medium | Report generator works. Needs professional client-ready formatting. |
| 7 | **User Management UI** | 🟡 Medium | Backend supports it. Frontend needs a user list / add / edit / delete interface for Admin. |
| 8 | **Scheduled Credit Budget Limit** | 🟡 Medium | Scheduler will use API credits. Need to set daily/weekly credit limits. |
| 9 | **India Regional Keyword Set** | 🟡 Medium | Import same 1,095 pages again but track for Indian cities. |
| 10 | **DataForSEO Integration** | 🟢 Low | Already coded. Just needs DataForSEO login/password credentials. |
| 11 | **Competitor Tracking** | 🟢 Low | Track competitor domains (ZoomInfo, Apollo.io) for the same keywords. |
| 12 | **Keyword Research Integration** | 🟢 Low | Suggest new keywords based on current ranking data. |
| 13 | **Mobile Native App** | 🟢 Low | Dashboard is responsive. Native mobile app is a future enhancement. |

---

## 7. Login Credentials (Local Development)

| Role | Email | Password |
|:--|:---|:---|
| Admin | admin@aventionseo.com | admin123 |
| Manager | manager@aventionseo.com | manager123 |
| SEO Member | member@aventionseo.com | member123 |
| Viewer | viewer@aventionseo.com | viewer123 |

> ⚠️ Change all passwords before deploying to production.

---

## 8. How to Run Locally

**Terminal 1 — Backend:**
```bash
cd d:\seo-automation-tool
.\venv\Scripts\Activate
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend → http://localhost:8000 | API Docs → http://localhost:8000/docs

**Terminal 2 — Frontend:**
```bash
cd d:\seo-automation-tool\frontend
npm run dev
```
Frontend → http://localhost:3000

---

## 9. Recommended Next Steps

1. Deploy backend to **Render.com** (free, ~30 min)
2. Deploy frontend to **Netlify** (~10 min)
3. Upgrade SerpApi to paid plan for full 1,095-page live checks
4. Add India location tracking for TargetNXT keywords
5. Set up SMTP for email report delivery

---

## 10. Final Summary

| Feature | Status |
|:---|:---|
| Backend API (FastAPI + Python) | ✅ Complete |
| Frontend Dashboard (React + TypeScript) | ✅ Complete |
| Authentication & 4 User Roles | ✅ Complete |
| Multi-Brand / Multi-Tenant Support | ✅ Complete |
| TargetNXT — 1,095 Pages Imported | ✅ Complete |
| SerpApi Live Google Ranking | ✅ Configured & Tested |
| Automated Weekly Scheduler | ✅ Built |
| Alerts & Notifications System | ✅ Built |
| GitHub Code Repository | ✅ Pushed |
| Production Deployment | ⏳ Pending |
| Full Live Rankings (1,095 pages) | ⏳ Needs SerpApi paid plan |
| India Location Rankings | ⏳ Pending |
| Email Notifications via SMTP | ⏳ Pending |
