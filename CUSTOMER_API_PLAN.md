# BuildMart — Customer App API Plan

Build plan for the **buyer-facing** half of the marketplace: discovery → cart → checkout →
order → payment → post-purchase. Seller Central, warehouse ops and advertising are out of
scope here and are tracked separately.

The data model is already defined (`data/schema.prisma` is the blueprint; `backend/*/models.py`
is the implementation). This document is about the API layer that does not exist yet.

---

## 1. Where the backend stands today

All 14 apps have their models written. Only four have an API.

| App | models | serializers | views | urls | Customer API status |
|---|---:|---:|---:|---:|---|
| `identity` | 140 | 109 | 104 | 16 | ⚠️ auth done, **Address API missing** |
| `catalog` | 262 | 520 | 505 | 12 | ⚠️ exists, **needs buyer enrichment** |
| `listings` | 75 | 203 | 251 | 10 | ⚠️ seller-facing only, **no public offers API** |
| `sellers` | 117 | 65 | 97 | 15 | ✅ seller portal (not customer scope) |
| `cart` | 78 | – | – | – | ❌ **to build** |
| `orders` | 140 | – | – | – | ❌ **to build** |
| `payments` | 91 | – | – | – | ❌ **to build** |
| `promotions` | 61 | – | – | – | ❌ **to build** |
| `returns` | 69 | – | – | – | ❌ **to build** |
| `reviews` | 117 | – | – | – | ❌ **to build** |
| `warehouses` | 130 | – | – | – | 🔒 internal only (no customer API) |
| `advertising` | 90 | – | – | – | out of scope |
| `communications` | 53 | – | – | – | ❌ buyer-seller messaging (P2) |
| `common` | – | – | – | – | enums, pagination, utils |

Currently mounted in `backend/core/urls.py`:

```
/api/auth/       → identity.urls
/api/catalog/    → catalog.urls
/api/seller/     → sellers.urls
/api/listings/   → listings.urls
/api/docs/       → Swagger (drf-spectacular)
```

Stack: Django 4.2, DRF, SimpleJWT, drf-spectacular, Postgres. No Redis, no Celery yet.

---

## 2. Fix these before writing any customer endpoint

These are project-wide and get worse the more code is written on top of them.

### 2.1 Everything is publicly readable and writable

```python
# core/settings.py — current
'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
```

Every endpoint added from here on is public by default. Flip it and opt out explicitly:

```python
'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
```

Then mark the genuinely public ones (`catalog` reads, product search, auth register/login)
with `permission_classes = [AllowAny]`. Doing this *after* cart and orders exist means
auditing every view instead of two.

### 2.2 Pagination is written but never wired up

`common/pagination.py` defines `StandardResultsSetPagination` — no view uses it as a default.
Product search and order history will return unbounded result sets.

```python
'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardResultsSetPagination',
'PAGE_SIZE': 20,
```

### 2.3 Throttling

Auth and checkout are abuse targets. `drf` throttling is free:

```python
'DEFAULT_THROTTLE_RATES': {'anon': '60/min', 'user': '600/min', 'checkout': '10/min'},
```

### 2.4 Currency says USD, the product is Indian B2B

Every money column defaults to `"USD"` (`Order.currency`, `Payment.currency`,
`SellerTransaction.currency`, `SellerBankAccount.currency`). The schema's own comments
reference GSTIN and the catalog is Indian construction materials.

Decide now: either default to `INR` or commit to real multi-currency (FX rate snapshot on
the order, per-currency settlement). Changing this after orders exist means backfilling
financial records.

### 2.5 Redis + Celery are needed by checkout, not later

Three things in the customer flow cannot be done synchronously in a request:

- releasing expired inventory reservations (scheduled)
- payment reconciliation / webhook retry
- order confirmation email + notifications

Add `celery`, `redis`, `django-redis` now and wire a single working task. Retrofitting a
queue after checkout is written means rewriting checkout.

### 2.6 `schema.prisma` does not validate

Line 706: `createdAt DateTim=e @default(now())` — typo, should be `DateTime`.
`prisma validate` fails on this. Harmless to the Django runtime, but the file is the
blueprint everyone reads, so fix it.

---

## 3. Schema gaps that block a correct order

The models exist, but five things are missing that cannot be added cleanly once real orders
are in the table. Do these migrations **before** Phase C4.

### 3.1 Order history mutates — no snapshots

```python
# orders/models.py — current
class OrderItem(models.Model):
    listing = models.ForeignKey('listings.Listing', on_delete=models.RESTRICT, ...)
```

The item's name, image and seller name are read live through `listing → product`. When a
seller edits the listing title or the catalog team fixes a product name, **every historical
invoice changes**. Same for `Order.shipping_address` — it is a FK to a mutable `Address` row,
so a customer editing their address rewrites where past orders were shipped.

Add snapshot columns:

```python
class OrderItem(models.Model):
    ...
    product_title_snapshot  = models.CharField(max_length=500)
    product_image_snapshot  = models.CharField(max_length=500, null=True, blank=True)
    asin_snapshot           = models.CharField(max_length=20)
    seller_sku_snapshot     = models.CharField(max_length=100)
    seller_name_snapshot    = models.CharField(max_length=255)
    condition_snapshot      = models.CharField(max_length=50)

class Order(models.Model):
    ...
    shipping_address_snapshot = models.JSONField()   # full address as shipped
    billing_address_snapshot  = models.JSONField()
```

Keep the FKs for joins and analytics; **render from the snapshot**.

### 3.2 No idempotency on order creation

A retried checkout on a flaky mobile connection creates two orders and charges twice.

```python
class Order(models.Model):
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
```

Client sends `Idempotency-Key` header; the endpoint returns the existing order on a repeat.

### 3.3 `Payment.gateway_transaction_id` cannot be filled at INITIATED

```python
gateway_transaction_id = models.CharField(max_length=255, unique=True)   # NOT NULL
```

`PaymentStatus.INITIATED` is the default, but at initiation you do not yet have a gateway
transaction id — only a gateway *order* id. Split them:

```python
gateway_order_id       = models.CharField(max_length=255, null=True, blank=True, db_index=True)
gateway_transaction_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
```

### 3.4 No webhook dedupe table

Gateways retry webhooks 5–10 times. Without a dedupe table, a captured payment is processed
repeatedly — double stock decrement, double confirmation email.

```python
class WebhookEvent(models.Model):
    id           = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    gateway      = models.CharField(max_length=50)
    event_id     = models.CharField(max_length=255)          # gateway's own id
    event_type   = models.CharField(max_length=100)
    payload      = models.JSONField()
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'webhook_events'
        unique_together = ('gateway', 'event_id')
```

### 3.5 Refunds have no money trail

`returns.ReturnRequest` carries `refund_amount` and `refunded_at`, but nothing links back to
the `Payment` that is being reversed. Reconciliation is impossible.

```python
class Refund(models.Model):
    id                = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    payment           = models.ForeignKey('payments.Payment', on_delete=models.RESTRICT, related_name='refunds')
    return_request    = models.ForeignKey('returns.ReturnRequest', null=True, blank=True, on_delete=models.SET_NULL)
    amount            = models.DecimalField(max_digits=12, decimal_places=2)
    gateway_refund_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status            = models.CharField(max_length=30)
    reason            = models.TextField()
    created_at        = models.DateTimeField(auto_now_add=True)
```

### 3.6 Reservation expiry needs a timestamp

`InventoryItem.reserved_stock` has no notion of *who* reserved or *when*. An abandoned
checkout holds stock forever. Either add `OrderItem.reserved_at` + a sweeper task, or a
dedicated `StockReservation` row keyed to the order with an `expires_at`.

---

## 4. Customer API surface

Base: `/api/`. All responses paginated via `StandardResultsSetPagination`.
Auth: `Authorization: Bearer <access>` (SimpleJWT) unless marked 🌐 public.

### C1 — Identity & addresses  (`identity`)

| Method | Endpoint | Notes |
|---|---|---|
| 🌐 POST | `/api/auth/register/` | ✅ exists |
| 🌐 POST | `/api/auth/login/` | ✅ exists |
| 🌐 POST | `/api/auth/token/refresh/` | ✅ exists |
| GET | `/api/auth/me/` | ✅ exists |
| POST | `/api/auth/change-password/` | ✅ exists |
| GET | `/api/auth/addresses/` | **new** — own addresses only |
| POST | `/api/auth/addresses/` | **new** |
| PATCH | `/api/auth/addresses/{id}/` | **new** |
| DELETE | `/api/auth/addresses/{id}/` | **new** — block if referenced by an order (`RESTRICT`); soft-delete instead |
| POST | `/api/auth/addresses/{id}/set-default/` | **new** — `is_default_shipping` / `is_default_billing`, one per flag |

Also surface `CustomerProfile` (Prime-equivalent membership, preferred currency/language) on
`/api/auth/me/` rather than a separate endpoint.

### C2 — Discovery & product detail  (`catalog`, `listings`)

| Method | Endpoint | Notes |
|---|---|---|
| 🌐 GET | `/api/catalog/products/` | ✅ exists — add facets + sort below |
| 🌐 GET | `/api/catalog/products/{asin}/` | ✅ exists — enrich with Buy Box block |
| 🌐 GET | `/api/catalog/categories/` | ✅ exists — add `?tree=true` for the browse-node hierarchy |
| 🌐 GET | `/api/catalog/brands/` | ✅ exists |
| 🌐 GET | `/api/catalog/products/{asin}/offers/` | **new** — all competing seller offers |
| 🌐 GET | `/api/catalog/products/{asin}/variations/` | **new** — parent→child ASIN matrix |
| 🌐 GET | `/api/catalog/search/?q=` | **new** — Postgres FTS over title + `search_keywords` |
| 🌐 GET | `/api/catalog/categories/{slug}/facets/` | **new** — filterable `CategoryAttribute`s + value counts |

**Buy Box block** on product detail — the single most important buyer-facing object:

```json
{
  "asin": "BM7K2P9XQ1",
  "title": "UltraTech PPC Cement 50kg",
  "buy_box": {
    "listing_id": "…", "seller": {"id": "…", "display_name": "Shree Traders", "feedback_percent": 97.5},
    "price": "385.00", "currency": "INR", "condition": "NEW",
    "fulfillment_channel": "MF", "commerce_channel": "BAZAAR",
    "in_stock": true, "max_order_quantity": 500,
    "delivery_estimate": "2026-10-25",
    "tier_prices": [{"min_quantity": 50, "price": "372.00"}, {"min_quantity": 200, "price": "360.00"}]
  },
  "other_offers_count": 6,
  "lowest_price": "379.00"
}
```

**Faceted filters** on product list (driven by `CategoryAttribute.is_filterable`):
`?category=&brand=&min_price=&max_price=&condition=&fulfillment=&attr.grade=OPC-53&sort=price_asc|price_desc|rating|newest`

> Buy Box selection is a background job, not a request-time computation. `Listing.is_buy_box_winner`
> already exists — a Celery beat task recomputes it per ASIN from price + seller metrics +
> fulfillment channel + stock. The API only reads the flag.

### C3 — Cart & wishlist  (`cart`)

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/cart/` | cart + live repricing + per-item validity flags |
| POST | `/api/cart/items/` | `{listing_id, quantity}` — upsert on `(cart, listing)` |
| PATCH | `/api/cart/items/{id}/` | `{quantity}` — validate against `max_order_quantity` + stock |
| DELETE | `/api/cart/items/{id}/` | |
| POST | `/api/cart/items/{id}/save-for-later/` | toggles `is_saved_for_later` |
| POST | `/api/cart/items/{id}/move-to-wishlist/` | |
| DELETE | `/api/cart/` | clear |
| GET/POST | `/api/cart/wishlists/` | |
| GET/PATCH/DELETE | `/api/cart/wishlists/{id}/` | |
| POST | `/api/cart/wishlists/{id}/items/` | `{product_id}` — records `added_price` for price-drop alerts |
| DELETE | `/api/cart/wishlists/{id}/items/{item_id}/` | |

**The cart never stores prices.** `CartItem` has no price column and that is correct — price
is computed on every read by `PricingEngine`. The cart response must flag each line so the UI
can show "price changed" / "out of stock" before checkout:

```json
{
  "items": [{
    "id": "…", "listing_id": "…", "quantity": 100,
    "unit_price": "372.00", "line_total": "37200.00",
    "applied_tier": {"min_quantity": 50, "price": "372.00"},
    "seller": {"id": "…", "display_name": "Shree Traders"},
    "is_available": true, "stock_warning": null, "price_changed_since_added": false
  }],
  "saved_for_later": [ … ],
  "summary": {"items_subtotal": "37200.00", "estimated_tax": "6696.00", "currency": "INR"}
}
```

### C4 — Checkout & orders  (`orders`, `promotions`)

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/checkout/preview/` | validate + price + **split preview**, no writes |
| POST | `/api/checkout/apply-promotion/` | validate code against `usage_limit_per_user`, `minimum_spend`, window |
| DELETE | `/api/checkout/promotion/` | |
| POST | `/api/orders/` | **requires `Idempotency-Key` header** |
| GET | `/api/orders/` | own orders, `?status=`, newest first |
| GET | `/api/orders/{order_number}/` | full detail from snapshots |
| POST | `/api/orders/{order_number}/cancel/` | allowed only while every item is `PENDING`/`ALLOCATED` |
| POST | `/api/orders/{order_number}/items/{item_id}/cancel/` | per-line cancel (`OrderItemStatus` supports it) |
| GET | `/api/orders/{order_number}/shipments/` | packages + `ShipmentCheckpoint` timeline |
| GET | `/api/orders/{order_number}/invoice/` | PDF, generated async |

`/api/checkout/preview/` is what makes a multi-vendor cart comprehensible to the buyer — it
returns the shipment split before any money moves:

```json
{
  "shipment_groups": [
    {"seller": "Shree Traders", "fulfillment_channel": "MF", "warehouse_code": "BLR1",
     "items": ["…"], "shipping_fee": "0.00", "estimated_delivery": "2026-10-25"},
    {"seller": "Metro Steel", "fulfillment_channel": "SF",
     "items": ["…"], "shipping_fee": "450.00", "estimated_delivery": "2026-10-29"}
  ],
  "totals": {"items_subtotal": "…", "shipping_total": "…", "tax_total": "…",
             "promotion_discount": "…", "grand_total": "…"},
  "blocking_issues": []
}
```

### C5 — Payments  (`payments`)

| Method | Endpoint | Notes |
|---|---|---|
| 🌐 GET | `/api/payments/methods/` | enabled `PaymentMethodType`s + COD eligibility for this cart |
| POST | `/api/payments/initiate/` | `{order_number, method}` → gateway order id + client token |
| 🌐 POST | `/api/payments/webhook/{gateway}/` | **signature-verified, no JWT**, idempotent via `WebhookEvent` |
| GET | `/api/payments/{order_number}/status/` | polling fallback for the app |

### C6 — Post-purchase  (`returns`, `reviews`, `communications`)

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/returns/` | `{order_item_id, reason, comment, evidence_images}` → generates `rma_number` |
| GET | `/api/returns/` · `/api/returns/{rma}/` | own returns |
| POST | `/api/returns/{rma}/cancel/` | |
| POST | `/api/reviews/products/` | one per `order_item` → sets `is_verified_purchase` |
| GET | 🌐 `/api/reviews/products/{asin}/` | `?rating=&sort=helpful\|recent`, with histogram |
| PATCH/DELETE | `/api/reviews/products/{id}/` | author only |
| POST | `/api/reviews/{id}/vote/` | helpful / not helpful, unique per user |
| POST | `/api/reviews/sellers/` | `SellerFeedback`, one per `order_item` |
| GET/POST | 🌐 `/api/reviews/questions/` | product Q&A |
| POST | `/api/reviews/questions/{id}/answers/` | |
| POST | `/api/claims/` | A-to-z guarantee claim (only after SLA window) |
| GET/POST | `/api/messages/` | buyer ↔ seller relay (P2) |

> Both `ProductReview.order_item_id` and `SellerFeedback.order_item_id` are unique — enforce
> "delivered item, not yet reviewed" in the serializer, not just at the DB level, so the
> client gets a readable error instead of a 500.

---

## 5. The two flows that carry all the risk

### 5.1 Checkout

```
POST /api/checkout/preview/              POST /api/orders/   (Idempotency-Key)
         │                                        │
         ▼                                        ▼
┌────────────────────────┐              ┌──────────────────────────────┐
│ 1 validate every line  │              │ transaction.atomic():        │
│   · listing ACTIVE     │              │  0 replay? → return existing │
│   · seller ACTIVE      │              │  1-5 same as preview         │
│     (not VACATION)     │              │  6 RESERVE stock             │
│   · stock available    │              │    select_for_update()       │
│ 2 price each line      │              │    available −= q            │
│   sale window? tier?   │              │    reserved  += q            │
│ 3 group shipments      │              │    + InventoryMovement row   │
│   (seller, channel,    │              │  7 Order PENDING_PAYMENT     │
│    warehouse)          │              │  8 OrderItems + SNAPSHOTS    │
│ 4 shipping per group   │              │  9 address snapshots         │
│ 5 tax + fees per line  │              │ 10 clear cart                │
│   referral · closing   │              └──────────────┬───────────────┘
└────────────────────────┘                             │
            same PricingEngine ─────────────────────────┘
```

**Rules that are not optional:**

- `PricingEngine.price_cart(cart, address)` is one pure function. Preview, order create and
  invoice all call it. Two implementations guarantee a totals mismatch.
- B2B tier pricing: resolve `ListingTierPrice` by `min_quantity <= qty`, highest match wins.
  This is the whole point of the B2B model — getting it wrong is a revenue bug.
- Fees come from `Category.referral_fee_percent` and `closing_fee_fixed`, snapshotted onto
  `OrderItem.referral_fee_charged` / `closing_fee_charged` at order time. Category rates change.
- Reserve stock with `select_for_update()` on `InventoryItem`. Without the lock two buyers
  oversell the last unit.
- Every stock mutation writes an `InventoryMovement` row. The ledger is the audit trail —
  `CUSTOMER_ORDER_RESERVED` here, `CUSTOMER_ORDER_DISPATCHED` on ship.
- Reservations expire. A Celery beat task releases `PENDING_PAYMENT` orders older than
  ~30 minutes: restore stock, write `InventoryMovement`, mark the order `CANCELLED`.

### 5.2 Payment webhook

```
gateway  ──POST /api/payments/webhook/razorpay/──►  verify HMAC signature
                                                           │
                                          WebhookEvent.get_or_create(gateway, event_id)
                                                           │
                                              already processed? ──yes──► 200 OK, stop
                                                           │ no
                                                 transaction.atomic():
                                                    Payment → CAPTURED
                                                    Order   → PAYMENT_CONFIRMED, paid_at
                                                    OrderItems → ALLOCATED
                                                    create Shipment per group
                                                    processed_at = now()
                                                           │
                                          Celery: confirmation email, seller notify
```

Always return `200` once the event is recorded, even if downstream work fails — otherwise
the gateway retries forever. Do the downstream work in a task with its own retries.

---

## 6. Order state machine

Status is never written directly; every transition goes through one function that validates
the move and writes an audit row.

```
PENDING_PAYMENT ──paid──► PAYMENT_CONFIRMED ──allocate──► PROCESSING
       │                                                      │
       │ 30-min sweeper                           ┌───────────┴───────────┐
       │ or user cancel                           ▼                       ▼
       ▼                                  PARTIALLY_SHIPPED ─────────► SHIPPED
   CANCELLED  ◄──────────────────────────────────────────────────────────┤
                                                                         ▼
                                      REFUNDED ◄──returns──────────  DELIVERED
```

`OrderItem` has its own machine (`PENDING → ALLOCATED → PACKED → SHIPPED → DELIVERED`, plus
`RETURN_REQUESTED → RETURNED → REFUND_PROCESSED`). The parent `Order.status` is **derived**
from its items — a cart split across two sellers is `PARTIALLY_SHIPPED` when one ships.
Compute it in one place after any item transition; do not let callers set it.

---

## 7. Conventions (match the existing code)

Taken from `catalog`, `listings`, `identity` — stay consistent.

```python
# models
id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
class Meta:
    db_table = 'snake_case_plural'
    indexes = [models.Index(fields=[...])]

# enums → common/enums.py, never inline TextChoices
# urls → DefaultRouter per app, mounted at /api/<app>/ in core/urls.py
# pagination → common.pagination.StandardResultsSetPagination
# docs → every view gets @extend_schema (drf-spectacular is already wired to /api/docs/)
```

Plus, for everything new:

| Rule | Why |
|---|---|
| `get_queryset()` filters by `request.user` first | row-level ownership; a 404 beats a 403 leak |
| real `permission_classes`, not `if` inside the view | auditable, testable, shows up in Swagger |
| `select_related` / `prefetch_related` for every serialized relation | cart and order detail are deep trees |
| counts via `annotate(Count(...))`, never `.count()` in a serializer method | N+1 |
| money is `Decimal`, never `float`; quantize at the boundary | rounding drift in financial rows |
| each new app ships with tests for its state transitions | checkout bugs are expensive |

---

## 8. Phases

| Phase | Scope | Depends on | Est. |
|---|---|---|---|
| **P0** | §2 settings fixes + §3 migrations + Redis/Celery skeleton | — | 3 days |
| **C1** | Address CRUD, profile on `/me/` | P0 | 2 days |
| **C2** | Offers API, Buy Box block, search, facets, variations | P0 | 1 week |
| **C3** | Cart + wishlist + `PricingEngine` (incl. B2B tiers) | C2 | 1 week |
| **C4** | Checkout preview, order create, cancel, history, promotions | C3 | 1.5 weeks |
| **C5** | Payment initiate + webhook + refund trail | C4 | 1 week |
| **C6** | Returns, reviews, seller feedback, Q&A | C4 | 1 week |
| **C7** | Buy Box recompute job, reservation sweeper, notifications | C5 | 4 days |

After **C4** the app is demo-able end to end on COD. **C5** turns on real money.

### Definition of done per phase

- endpoints appear in `/api/docs/` with request/response examples
- `get_queryset` ownership test + permission test per endpoint
- for C4/C5: a concurrency test (two buyers, one unit) and an idempotency test (same key twice)

---

## 9. Open decisions

1. **Currency** — lock to INR, or build real multi-currency? (§2.4)
2. **COD** — `PaymentMethodType.CASH_ON_DELIVERY` exists. Eligibility rules (pincode, order
   value cap, seller opt-in) are undefined.
3. **Tax** — `Order.tax_total` is a flat column. Indian GST needs CGST/SGST/IGST split by
   buyer/seller state and HSN code per product. If GST invoices are required, this needs
   per-line tax breakup columns before C4.
4. **Quick commerce** — `CommerceChannel.QUICK_COMMERCE` (8–10 km hyperlocal) exists on
   `Listing` but nothing consumes it. Does the customer app need pincode serviceability and
   a separate delivery promise for it? That changes C2 and C4.
5. **Guest checkout** — `Cart` is `OneToOne` to a user, so an anonymous cart is impossible
   today. If guest checkout is wanted, add a session-keyed cart and a merge-on-login step.
