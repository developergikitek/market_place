import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from common.enums import (
    FulfillmentChannel, OrderItemStatus, OrderStatus, PaymentMethodType, PaymentStatus, ShipmentStatus,
    ShippingSpeed, UserRole,
)
from identity.models import Address, User
from listings.models import Listing
from orders.models import Order, OrderItem, Shipment, ShipmentCheckpoint
from payments.models import Payment
from sellers.utils import resolve_request_seller
from warehouses.models import InventoryItem

PAYMENT_PREFIX = "pay_ordseed_"
CUSTOMERS = [
    ("Rohit Verma", "9810000001", "Noida", "Uttar Pradesh", "201301"),
    ("Priya Nair", "9810000002", "Kochi", "Kerala", "682001"),
    ("Amit Patel", "9810000003", "Ahmedabad", "Gujarat", "380009"),
    ("Sneha Kulkarni", "9810000004", "Pune", "Maharashtra", "411001"),
    ("Vikram Singh", "9810000005", "Jaipur", "Rajasthan", "302001"),
    ("Ananya Das", "9810000006", "Kolkata", "West Bengal", "700016"),
    ("Karan Mehta", "9810000007", "Gurugram", "Haryana", "122002"),
    ("Fatima Sheikh", "9810000008", "Hyderabad", "Telangana", "500034"),
    ("Arjun Reddy Constructions", "9810000009", "Bengaluru", "Karnataka", "560037"),
    ("Meera Iyer", "9810000010", "Chennai", "Tamil Nadu", "600040"),
    ("Sahil Builders LLP", "9810000011", "Lucknow", "Uttar Pradesh", "226010"),
    ("Neha Gupta", "9810000012", "Indore", "Madhya Pradesh", "452010"),
]
CARRIERS = ["Delhivery", "Blue Dart", "Ecom Express", "XpressBees", "DTDC"]
METHODS = [PaymentMethodType.UPI, PaymentMethodType.UPI, PaymentMethodType.CREDIT_CARD,
           PaymentMethodType.DEBIT_CARD, PaymentMethodType.NET_BANKING]

# (order status, how many, days-ago range)
PLAN = [
    (OrderStatus.PENDING_PAYMENT, 3, (0, 1)),
    (OrderStatus.PAYMENT_CONFIRMED, 8, (0, 5)),
    (OrderStatus.PROCESSING, 5, (1, 3)),
    (OrderStatus.SHIPPED, 6, (2, 6)),
    (OrderStatus.PARTIALLY_SHIPPED, 2, (2, 4)),
    (OrderStatus.DELIVERED, 6, (6, 14)),
    (OrderStatus.CANCELLED, 3, (1, 8)),
]
D = Decimal


def _shift_reserved(listing, qty):
    """Reserve (or release, with a negative qty) units on the listing's main warehouse item."""
    item = InventoryItem.objects.filter(listing=listing).order_by('-available_stock').first()
    if item:
        InventoryItem.objects.filter(pk=item.pk).update(reserved_stock=F('reserved_stock') + qty)


class Command(BaseCommand):
    help = "Seed demo orders in every status (with payments, shipments and tracking) for the demo seller."

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help="Remove previously seeded orders first (releases their reserved stock)")

    def handle(self, *args, **options):
        if options['reset']:
            self._reset()
        seller = resolve_request_seller(None)
        listings = list(Listing.objects.filter(seller=seller).exclude(status='ARCHIVED').select_related('product')) if seller else []
        if not listings:
            self.stderr.write(self.style.ERROR("The demo seller has no listings to order."))
            return
        if Payment.objects.filter(gateway_transaction_id__startswith=PAYMENT_PREFIX).exists():
            self.stdout.write("Demo orders already present (use --reset to recreate).")
            return

        rng = random.Random(7)
        now = timezone.now()
        created = 0
        with transaction.atomic():
            customers = [self._customer(*c) for c in CUSTOMERS]
            n = 0
            for order_status, count, (lo, hi) in PLAN:
                for _ in range(count):
                    lines = rng.sample(listings, 2 if (order_status == OrderStatus.PARTIALLY_SHIPPED or rng.random() < 0.3) and len(listings) > 1 else 1)
                    placed = now - timedelta(days=rng.uniform(lo, hi), hours=rng.randint(0, 6))
                    self._order(n, order_status, customers[n % len(customers)], seller, lines, placed, rng)
                    n += 1
                    created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} orders across {len(PLAN)} statuses for {seller.display_name}."))

    def _reset(self):
        orders = Order.objects.filter(payments__gateway_transaction_id__startswith=PAYMENT_PREFIX).distinct()
        with transaction.atomic():
            # Give back stock still reserved by unshipped seeded lines.
            for line in OrderItem.objects.filter(order__in=orders, status__in=[OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED]):
                _shift_reserved(line.listing, -line.quantity)
            InventoryItem.objects.filter(reserved_stock__lt=0).update(reserved_stock=0)
            count = orders.count()
            Order.objects.filter(id__in=list(orders.values_list('id', flat=True))).delete()
        self.stdout.write(f"Removed {count} seeded orders.")

    @staticmethod
    def _customer(name, phone, city, state, pin):
        first, _, last = name.partition(" ")
        user, _ = User.objects.get_or_create(
            phone=phone, defaults={"username": f"cust{phone[-4:]}", "first_name": first, "last_name": last, "role": UserRole.CUSTOMER},
        )
        address = user.addresses.first() or Address.objects.create(
            user=user, full_name=name, phone_number=phone, street_line1="Site office, Plot 12", city=city,
            state_or_province=state, postal_code=pin, country_code="IN", is_default_shipping=True, is_default_billing=True,
            is_commercial=name.endswith(("LLP", "Constructions")),
        )
        return user, address

    def _order(self, n, order_status, customer, seller, listings, placed, rng):
        user, address = customer
        while True:
            number = f"{rng.randint(401, 408)}-{rng.randint(1000000, 9999999)}-{rng.randint(1000000, 9999999)}"
            if not Order.objects.filter(order_number=number).exists():
                break
        paid = order_status != OrderStatus.PENDING_PAYMENT
        lines, subtotal, tax, shipping = [], D('0'), D('0'), D('0')
        for listing in listings:
            qty = rng.choice([1, 1, 2, 3, 5, 10])
            unit = listing.sale_price or listing.standard_price
            total = (unit * qty).quantize(D('0.01'))
            line_tax = (total * D('0.18')).quantize(D('0.01'))
            ship_fee = D('0') if total >= 999 else D('99')
            lines.append((listing, qty, unit, total, line_tax, ship_fee))
            subtotal, tax, shipping = subtotal + total, tax + line_tax, shipping + ship_fee
        order = Order.objects.create(
            order_number=number, customer=user, status=order_status, currency="INR",
            items_subtotal=subtotal, shipping_total=shipping, tax_total=tax, promotion_discount=D('0'),
            grand_total=subtotal + shipping + tax, shipping_address=address, billing_address=address,
            shipping_speed=rng.choice([ShippingSpeed.STANDARD, ShippingSpeed.STANDARD, ShippingSpeed.EXPEDITED]),
            is_gift=False, placed_at=placed, paid_at=placed + timedelta(minutes=2) if paid else None,
        )
        payment_status = {
            OrderStatus.PENDING_PAYMENT: PaymentStatus.INITIATED,
            OrderStatus.CANCELLED: PaymentStatus.REFUNDED,
        }.get(order_status, PaymentStatus.CAPTURED)
        Payment.objects.create(
            order=order, payment_method=rng.choice(METHODS), gateway_provider="RAZORPAY",
            gateway_transaction_id=f"{PAYMENT_PREFIX}{n:04d}_{rng.randint(100000, 999999)}", amount=order.grand_total,
            currency="INR", status=payment_status, authorized_at=order.paid_at, captured_at=order.paid_at,
        )

        for idx, (listing, qty, unit, total, line_tax, ship_fee) in enumerate(lines):
            item_status = self._line_status(order_status, idx)
            shipment = None
            if item_status in (OrderItemStatus.SHIPPED, OrderItemStatus.DELIVERED):
                shipment = self._shipment(order, seller, listing, placed, item_status == OrderItemStatus.DELIVERED, rng)
            if item_status in (OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED):
                _shift_reserved(listing, qty)
            OrderItem.objects.create(
                order=order, listing=listing, seller=seller, shipment=shipment, status=item_status, quantity=qty,
                unit_price=unit, total_price=total, item_tax_amount=line_tax, item_shipping_fee=ship_fee,
                item_discount_amount=D('0'), referral_fee_charged=(total * D('0.06')).quantize(D('0.01')),
                closing_fee_charged=D('20.00'),
                fba_fulfillment_fee=D('45.00') * qty if listing.fulfillment_channel == FulfillmentChannel.FBA else D('0'),
                gift_wrap_requested=False, gift_wrap_fee=D('0'),
            )

    @staticmethod
    def _line_status(order_status, idx):
        return {
            OrderStatus.PENDING_PAYMENT: OrderItemStatus.PENDING,
            OrderStatus.PAYMENT_CONFIRMED: OrderItemStatus.PENDING,
            OrderStatus.PROCESSING: OrderItemStatus.ALLOCATED if idx % 2 == 0 else OrderItemStatus.PACKED,
            OrderStatus.SHIPPED: OrderItemStatus.SHIPPED,
            OrderStatus.PARTIALLY_SHIPPED: OrderItemStatus.SHIPPED if idx == 0 else OrderItemStatus.ALLOCATED,
            OrderStatus.DELIVERED: OrderItemStatus.DELIVERED,
            OrderStatus.CANCELLED: OrderItemStatus.CANCELLED,
        }[order_status]

    @staticmethod
    def _shipment(order, seller, listing, placed, delivered, rng):
        inv = listing.inventory_items.select_related('warehouse').first()
        origin = inv.warehouse.city if inv and inv.warehouse else "Gurugram"
        dispatched = placed + timedelta(days=1, hours=rng.randint(2, 10))
        now = timezone.now()
        events = [(dispatched, origin, "Picked up by courier"),
                  (dispatched + timedelta(hours=14), f"{origin} hub", "Departed origin facility")]
        status = ShipmentStatus.IN_TRANSIT
        if delivered or rng.random() < 0.4:
            events.append((dispatched + timedelta(days=2), order.shipping_address.city, "Out for delivery"))
            status = ShipmentStatus.OUT_FOR_DELIVERY
        if delivered:
            events.append((dispatched + timedelta(days=2, hours=6), order.shipping_address.city, "Delivered"))
            status = ShipmentStatus.DELIVERED
        events = [e for e in events if e[0] <= now] or events[:1]
        shipment = Shipment.objects.create(
            shipment_number=f"PKG-{rng.randint(1000000, 9999999)}", order=order, seller=seller,
            warehouse=inv.warehouse if inv else None, status=status, carrier_name=rng.choice(CARRIERS),
            tracking_number=f"AWB{rng.randint(10**9, 10**10 - 1)}", estimated_delivery_at=dispatched + timedelta(days=3),
            dispatched_at=dispatched, delivered_at=events[-1][0] if delivered else None,
        )
        for when, where, text in events:
            ShipmentCheckpoint.objects.create(shipment=shipment, event_time=when, location=where, status_text=text)
        return shipment
