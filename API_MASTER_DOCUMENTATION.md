# 🏗️ Buildmart Construction Marketplace — Master API Reference

> **Complete Backend API Documentation**  
> **Base URL:** `http://127.0.0.1:8000` (Local Development)  
> **Auth Header:** `Authorization: Bearer <access_token>`

---

## 📑 Table of Contents

1. [System & Health APIs](#1-system--health-apis)
2. [Authentication & Identity APIs (`/api/auth/`)](#2-authentication--identity-apis-apiauth)
3. [Public Catalog APIs (`/api/catalog/`)](#3-public-catalog-apis-apicatalog)
   - [Products (`/api/catalog/products/`)](#31-products-apicatalogproducts)
   - [Categories & Taxonomy (`/api/catalog/categories/`)](#32-categories--taxonomy-apicatalogcategories)
   - [Brands (`/api/catalog/brands/`)](#33-brands-apicatalogbrands)
4. [Seller Portal APIs (`/api/seller/`)](#4-seller-portal-apis-apiseller)
   - [Seller Listings & Inventory (`/api/seller/listings/`)](#41-seller-listings--inventory-apisellerlistings)
   - [Seller Master Product Creation (`/api/seller/products/`)](#42-seller-master-product-creation-apisellerproducts)
   - [Seller Store Profile & Settings (`/api/seller/profile/`)](#43-seller-store-profile--settings-apisellerprofile)
5. [Standard Response & Error Codes](#5-standard-response--error-codes)

---

## 1. System & Health APIs

### 1.1 Root Health Check
- **Endpoint:** `GET /` or `GET /api/health/`
- **Auth Required:** No
- **Response `200 OK`:**
```json
{
  "status": "online",
  "service": "Construction Marketplace API",
  "version": "1.0.0",
  "message": "Django backend is up and running!"
}
```

---

## 2. Authentication & Identity APIs (`/api/auth/`)

### 2.1 User Registration
- **Endpoint:** `POST /api/auth/register/`
- **Auth Required:** No
- **Request Body:**
```json
{
  "phone": "+919876543210",
  "password": "StrongPassword@123",
  "first_name": "Ramesh",
  "last_name": "Kumar",
  "email": "ramesh@example.com",
  "role": "CUSTOMER"
}
```
*Note: `phone` is mandatory (10 digits or with `+91`), `email` is optional.*

### 2.2 User Login (Phone or Email)
- **Endpoint:** `POST /api/auth/login/`
- **Auth Required:** No
- **Request Body:**
```json
{
  "phone": "9999999999",
  "password": "AdminPassword@123"
}
```
*Smart Login: Supports 10-digit mobile number, `+919999999999`, or `email` in the `phone` field.*
- **Response `200 OK`:**
```json
{
  "message": "Login successful.",
  "user": {
    "id": "953c7e3f-8455-4e5c-8192-757468bbf85a",
    "phone": "+919999999999",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

### 2.3 Refresh Access Token
- **Endpoint:** `POST /api/auth/token/refresh/`
- **Request Body:**
```json
{
  "refresh": "<refresh_token>"
}
```

### 2.4 User Profile (`Me`)
- **Endpoint:** `GET /api/auth/me/` | `PATCH /api/auth/me/`
- **Auth Required:** Yes (`Bearer <token>`)

### 2.5 Shipping & Billing Addresses
- **Endpoint:** `GET /api/auth/addresses/` | `POST /api/auth/addresses/`
- **Auth Required:** Yes (`Bearer <token>`)
- **Request Body (POST):**
```json
{
  "address_type": "SHIPPING",
  "full_name": "Ramesh Construction",
  "phone": "+919876543210",
  "street_line1": "Plot 42, Sector 18",
  "city": "Gurugram",
  "state_or_province": "Haryana",
  "postal_code": "122015",
  "is_default_shipping": true
}
```

---

## 3. Public Catalog APIs (`/api/catalog/`)

### 3.1 Products (`/api/catalog/products/`)

#### A. List Products (With Filters & Search)
- **Endpoint:** `GET /api/catalog/products/`
- **Auth Required:** No
- **Query Parameters:**
  - `search` / `q`: Keyword search across title, brand, description, ASIN, model (`?search=cement`)
  - `category`: Category slug, UUID, or browse node ID (`?category=ppc`)
  - `brand`: Brand slug or name (`?brand=ultratech`)
  - `min_price` & `max_price`: Standard price range (`?min_price=300&max_price=800`)
  - `in_stock`: Only in-stock items (`?in_stock=true`)
  - `fulfillment`: Filter by logistics (`?fulfillment=FBA` for Buildmart, `FBM` for merchant)
  - `ordering` / `sort`: `price_asc`, `price_desc`, `newest`, `title_asc`
  - `page` & `page_size`: Pagination (`?page=1&page_size=20`)
- **Response `200 OK`:**
```json
{
  "count": 4,
  "total_pages": 1,
  "current_page": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "ef935d88-ee86-4fc4-b833-c12b4e1acde0",
      "asin": "BM01CEMENT01",
      "title": "UltraTech Super Cement (50 kg Bag) - Premium PPC Grade",
      "brand": { "id": "...", "name": "UltraTech", "slug": "ultratech" },
      "category": { "name": "PPC", "slug": "ppc", "level": 5 },
      "primary_image": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f",
      "buy_box_listing": {
        "seller_name": "Gikitek",
        "is_official_buildmart": true,
        "fulfillment_channel_display": "Fulfillment by Buildmart",
        "standard_price": "385.00",
        "effective_price": "385.00",
        "in_stock": true,
        "available_stock": 5000,
        "b2b_tier_prices": [
          { "min_quantity": 50, "discounted_price": "375.00" },
          { "min_quantity": 200, "discounted_price": "360.00" }
        ]
      },
      "rating_summary": { "average_rating": 0.0, "total_reviews": 0 }
    }
  ]
}
```

#### B. Product Detail Page (PDP)
- **Endpoint:** `GET /api/catalog/products/<id_or_asin>/`
- **Lookup Support:** Can pass either **ASIN** (`BM01CEMENT01`) or **UUID** (`ef935d88-...`)
- **Response `200 OK`:** Includes all metadata, bullet points, breadcrumbs (L1 to L5), attributes/specifications, image gallery, Buy Box winner, and competitive offers.

#### C. Other Sellers Offers (Compare Prices)
- **Endpoint:** `GET /api/catalog/products/<id_or_asin>/offers/`
- **Description:** Amazon-style "Other sellers on Buildmart".
- **Response `200 OK`:**
```json
{
  "asin": "BM01CEMENT01",
  "title": "UltraTech Super Cement (50 kg Bag) - Premium PPC Grade",
  "total_offers": 1,
  "offers": [
    {
      "id": "90f1ad6c-f80f-41ad-b7fc-a23b9808b18e",
      "seller_sku": "GIK-ULTRA-PPC-50",
      "seller": { "display_name": "Gikitek", "is_official_buildmart": true },
      "fulfillment_channel_display": "Fulfillment by Buildmart",
      "standard_price": "385.00",
      "effective_price": 385.0,
      "is_buy_box_winner": true,
      "available_stock": 5000,
      "b2b_tier_prices": [
        { "min_quantity": 50, "discounted_price": "375.00" },
        { "min_quantity": 200, "discounted_price": "360.00" }
      ]
    }
  ]
}
```

#### D. Featured Products (Homepage Carousel)
- **Endpoint:** `GET /api/catalog/products/featured/`
- **Description:** Returns top 8 flagship products directly for homepage sliders without pagination wrappers.

---

### 3.2 Categories & Taxonomy (`/api/catalog/categories/`)

| Method | Endpoint | Query / Param | Description |
|---|---|---|---|
| `GET` | `/api/catalog/categories/` | `?root_only=true` | Returns the 7 Top Level-1 Root Departments |
| `GET` | `/api/catalog/categories/` | `?level=2` | Filter categories by depth level (1 to 5) |
| `GET` | `/api/catalog/categories/<id>/` | — | Category details with attribute specifications |
| `GET` | `/api/catalog/categories/<id>/children/` | — | Immediate subcategories |
| `GET` | `/api/catalog/categories/<id>/attributes/` | — | Category specifications schema & allowed options |

---

### 3.3 Brands (`/api/catalog/brands/`)

| Method | Endpoint | Query / Param | Description |
|---|---|---|---|
| `GET` | `/api/catalog/brands/` | `?search=tata` | Search & list registered brands |
| `GET` | `/api/catalog/brands/<id>/` | — | Brand details |
| `GET` | `/api/catalog/brands/<id>/products/` | — | Paginated list of products under this brand |

---

## 4. Seller Portal APIs (`/api/seller/`)

> 🔒 **Requires:** `Authorization: Bearer <token>` of an active Seller account.

---

### 4.1 Seller Listings & Inventory (`/api/seller/listings/`)

#### A. List My Listings
- **Endpoint:** `GET /api/seller/listings/`
- **Query Parameters:** `?status=ACTIVE` (or `INACTIVE`), `?search=<sku_or_title>`
- **Description:** Returns only the logged-in merchant's listings.

#### B. Create Offer on Existing ASIN
- **Endpoint:** `POST /api/seller/listings/`
- **Request Body:**
```json
{
  "product_asin": "BM01CEMENT01",
  "seller_sku": "MYSTORE-CEMENT-01",
  "standard_price": "382.00",
  "sale_price": "375.00",
  "fulfillment_channel": "MAKAANO_FULFILLED",
  "initial_stock": 500,
  "b2b_tier_prices": [
    { "min_quantity": 50, "discounted_price": "368.00" },
    { "min_quantity": 200, "discounted_price": "355.00" }
  ]
}
```

#### C. Update Listing Price & Stock
- **Endpoint:** `PATCH /api/seller/listings/<id>/`
- **Request Body:**
```json
{
  "standard_price": "380.00",
  "sale_price": "370.00",
  "initial_stock": 750
}
```

#### D. Quick Pause / Resume Listing
- **Endpoint:** `POST /api/seller/listings/<id>/toggle_status/`
- **Description:** Switches listing between `ACTIVE` and `INACTIVE`.

#### E. Quick Stock Adjustment
- **Endpoint:** `POST /api/seller/listings/<id>/update_stock/`
- **Request Body:** `{"available_stock": 600}`

#### F. Delete / Archive Listing
- **Endpoint:** `DELETE /api/seller/listings/<id>/`
- **Description:** Safely archives or deletes offer.

#### G. Seller Dashboard Summary
- **Endpoint:** `GET /api/seller/listings/summary/`
- **Response `200 OK`:**
```json
{
  "total_listings": 4,
  "active_listings": 4,
  "out_of_stock_listings": 0,
  "buy_box_winners": 4,
  "total_stock_units": 9050
}
```

---

### 4.2 Seller Master Product Creation (`/api/seller/products/`)

#### Create Brand New Catalog Product (ASIN)
- **Endpoint:** `POST /api/seller/products/`
- **Description:** Generates new canonical ASIN, saves catalog photos & specs, and creates initial seller offer in 1 atomic call.
- **Request Body:**
```json
{
  "title": "UltraTech Weather Pro Water-Repellent Cement (50 kg)",
  "brand_id": "09ead7f5-31d2-5dff-9678-aabb968f3b73",
  "category_id": "7556bf62-41c3-5613-9b51-02c1dcb9a356",
  "description": "Hydrophobic water-repellent cement for damp-proof structures.",
  "bullet_points": [
    "Prevents dampness and efflorescence on walls",
    "Protects steel rebar against corrosion"
  ],
  "search_keywords": ["waterproof cement", "weather pro"],
  "images": [
    {
      "image_url": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343",
      "variant_tag": "MAIN",
      "sort_order": 0
    }
  ],
  "initial_listing": {
    "seller_sku": "GIK-WEATHER-PRO-50",
    "standard_price": "410.00",
    "sale_price": "395.00",
    "fulfillment_channel": "MAKAANO_FULFILLED",
    "initial_stock": 1200,
    "b2b_tier_prices": [
      { "min_quantity": 50, "discounted_price": "385.00" },
      { "min_quantity": 200, "discounted_price": "370.00" }
    ]
  }
}
```
- **Response `201 Created`:** Returns full product object with newly assigned `asin` (e.g. `BMSWQJH2M9`).

---

### 4.3 Seller Store Profile & Settings (`/api/seller/profile/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/seller/profile/me/` | Merchant store profile & health metrics (defect rate, feedback) |
| `PATCH` | `/api/seller/profile/me/` | Update store display name, banner, logo, support contact |
| `GET / POST` | `/api/seller/profile/kyc_documents/` | View or upload GST, PAN, Business KYC documents |
| `GET / POST` | `/api/seller/profile/bank_accounts/` | View or add payout bank accounts (account numbers masked) |
| `POST` | `/api/seller/profile/toggle_holiday_mode/` | Enable / Disable vacation/holiday mode |

---

## 5. Standard Response & Error Codes

| HTTP Status | Meaning | Scenario |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, PATCH, or action |
| `201 Created` | Created | Successfully created product, listing, address, or user |
| `400 Bad Request` | Validation Error | Missing fields, sale price >= standard price, duplicate SKU |
| `401 Unauthorized` | Auth Failed | Invalid/expired JWT token or credentials |
| `403 Forbidden` | Access Denied | Non-seller trying to access seller portal, or modifying another merchant's listing |
| `404 Not Found` | Not Found | ASIN or UUID does not exist |

