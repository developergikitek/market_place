# Construction Marketplace - Django Backend

A modern Django backend setup for Construction Marketplace connected to PostgreSQL (via EC2 SSH tunnel).

---

## 📁 Directory Structure
```
construction_marketplace/
├── start.sh              # Starts SSH tunnel (port 5433 -> EC2 5432) & starts Django server
├── README.md
└── backend/
    ├── core/             # Django project settings & URL configuration
    ├── manage.py
    ├── requirements.txt  # Django, DRF, CORS, dj-database-url, psycopg2, python-dotenv
    ├── .env              # Environment configurations & database URL
    ├── .env.example
    ├── .gitignore
    └── venv/             # Python virtual environment
```

---

## 🚀 How to Run

Simply run the startup script from the root folder:

```bash
cd /Users/vishalshukla/Desktop/construction_marketplace
./start.sh
```

This script:
1. Checks and opens the SSH tunnel to EC2 PostgreSQL (`LOCAL_PORT=5433` -> `EC2:5432`).
2. Activates the Python virtual environment (`venv`).
3. Runs `python3 manage.py runserver` at `http://127.0.0.1:8000/`.

---

## 🌐 API Endpoints
- **Health Check**: `GET http://127.0.0.1:8000/api/health/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

## 🗄️ Database
- Database: `gikitek` (PostgreSQL 15.19 on EC2)
- User: `gitkitek_admin`
- Port (Local Tunnel): `5433`
