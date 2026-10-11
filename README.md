# 🏗️ Buildmart — Construction Marketplace Django Backend

A production-grade Django REST Framework backend for the Construction Material Marketplace connected to remote PostgreSQL (via EC2 SSH tunnel).

---

## 📖 Master API Documentation
👉 **Complete Master API Reference with payloads and curl commands:**  
**[API_MASTER_DOCUMENTATION.md](file:///Users/vishalshukla/Desktop/construction_marketplace/API_MASTER_DOCUMENTATION.md)**

### Available API Modules:
- 🔐 **Identity & Auth (`/api/auth/`)**: Phone-mandatory JWT auth, registration, profiles, addresses.
- 📦 **Public Catalog (`/api/catalog/`)**: Products (search, filters, ASIN PDP, multi-seller offers), categories (7 root departments, subcategories, attributes schema), brands.
- 🏪 **Seller Portal (`/api/seller/`)**: Listing management (CRUD, price & stock updates, bulk B2B tier pricing, status pause/resume), brand new product ASIN creation, seller profile & KYC.

---

## 📁 Directory Structure
```
construction_marketplace/
├── API_MASTER_DOCUMENTATION.md # Master API reference with all endpoints, requests & responses
├── start.sh                    # Starts SSH tunnel (port 5433 -> EC2 5432) & runs Django
├── README.md
├── data/                       # JSON seed fixtures (categories, brands, attributes)
└── backend/
    ├── core/                   # Project settings, middleware, root URLs
    ├── manage.py
    ├── requirements.txt
    ├── common/                 # Global enums, pagination, utils
    ├── identity/               # Custom User (phone mandatory), JWT auth, addresses
    ├── catalog/                # Master products, brands, categories, attributes schema
    ├── listings/               # Merchant offers, buy-box, B2B wholesale tier pricing
    ├── sellers/                # Seller profiles, KYC docs, bank accounts, metrics
    └── warehouses/             # Multi-hub inventory, stock allocation
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

## 🌐 Quick Links
- **API Documentation**: [`API_MASTER_DOCUMENTATION.md`](file:///Users/vishalshukla/Desktop/construction_marketplace/API_MASTER_DOCUMENTATION.md)
- **Health Check**: `GET http://127.0.0.1:8000/api/health/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

## 🗄️ Database
- Database: `gikitek` (PostgreSQL 15.19 on EC2 via SSH tunnel)
- User: `gitkitek_admin`
- Port (Local Tunnel): `5433`
