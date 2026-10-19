import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from common.enums import (
    AtoZClaimStatus, OrderItemStatus, OrderStatus, PaymentMethodType, PaymentStatus, ReturnReason,
    ReturnStatus, ShipmentStatus, UserRole,
)
from identity.models import Address, User
from listings.models import Listing
from orders.models import Order, OrderItem, Shipment
from payments.models import Payment
from returns.models import AtoZClaim, ReturnRequest
from sellers.utils import resolve_request_seller

ORDER_PREFIX = "MKO-SEED-"

CUSTOMERS = [
    ("Rohit Verma", "9810000001", "Noida", "Uttar Pradesh", "201301"),
    ("Priya Nair", "9810000002", "Kochi", "Kerala", "682001"),
    ("Amit Patel", "9810000003", "Ahmedabad", "Gujarat", "380009"),
    ("Sneha Kulkarni", "9810000004", "Pune", "Maharashtra", "411001"),
    ("Vikram Singh", "9810000005", "Jaipur", "Rajasthan", "302001"),
    ("Ananya Das", "9810000006", "Kolkata", "West Bengal", "700016"),
    ("Karan Mehta", "9810000007", "Gurugram", "Haryana", "122002"),
    ("Fatima Sheikh", "9810000008", "Hyderabad", "Telangana", "500034"),
]

COMMENTS = {
    ReturnReason.DEFECTIVE_OR_DOES_NOT_WORK: "Stopped working after two days of use on site.",
    ReturnReason.WRONG_ITEM_SENT: "Ordered 12mm but received 10mm bars.",
    ReturnReason.ITEM_NOT_AS_DESCRIBED: "Colour and finish are different from the listing photos.",
    ReturnReason.ACCIDENTAL_ORDER: "Placed the order twice by mistake.",
    ReturnReason.FOUND_BETTER_PRICE: "Got a better quote from a local dealer.",
    ReturnReason.MISSING_PARTS_OR_ACCESSORIES: "Mounting screws and brackets were missing.",
    ReturnReason.SHIPPING_BOX_AND_ITEM_DAMAGED: "Outer packaging torn and two bags burst in transit.",
    ReturnReason.ARRIVED_TOO_LATE: "Delivered after the site work was already completed.",
}

# (status, reason, restocking fee %) — one or more of every lifecycle stage.
RETURN_PLAN = [
    (ReturnStatus.REQUESTED, ReturnReason.DEFECTIVE_OR_DOES_NOT_WORK, 0),
    (ReturnStatus.REQUESTED, ReturnReason.FOUND_BETTER_PRICE, 0),
    (ReturnStatus.REQUESTED, ReturnReason.WRONG_ITEM_SENT, 0),
    (ReturnStatus.SELLER_APPROVED, ReturnReason.ACCIDENTAL_ORDER, 10),
    (ReturnStatus.AUTO_AUTHORIZED, ReturnReason.SHIPPING_BOX_AND_ITEM_DAMAGED, 0),
    (ReturnStatus.RETURN_LABEL_GENERATED, ReturnReason.ITEM_NOT_AS_DESCRIBED, 0),
    (ReturnStatus.IN_TRANSIT_TO_FC, ReturnReason.MISSING_PARTS_OR_ACCESSORIES, 0),
    (ReturnStatus.DELIVERED_TO_FC, ReturnReason.DEFECTIVE_OR_DOES_NOT_WORK, 0),
    (ReturnStatus.INSPECTED_SELLABLE, ReturnReason.ACCIDENTAL_ORDER, 15),
    (ReturnStatus.INSPECTED_DAMAGED, ReturnReason.SHIPPING_BOX_AND_ITEM_DAMAGED, 25),
    (ReturnStatus.REFUND_ISSUED, ReturnReason.WRONG_ITEM_SENT, 0),
    (ReturnStatus.REFUND_ISSUED, ReturnReason.FOUND_BETTER_PRICE, 20),
    (ReturnStatus.REJECTED, ReturnReason.ARRIVED_TOO_LATE, 0),
    (ReturnStatus.CANCELLED, ReturnReason.ACCIDENTAL_ORDER, 0),
]

SHIPPED_STATUSES = {
    ReturnStatus.RETURN_LABEL_GENERATED, ReturnStatus.IN_TRANSIT_TO_FC, ReturnStatus.DELIVERED_TO_FC,
    ReturnStatus.INSPECTED_SELLABLE, ReturnStatus.INSPECTED_DAMAGED, ReturnStatus.REFUND_ISSUED,
}
ITEM_STATUS_FOR = {
    ReturnStatus.DELIVERED_TO_FC: OrderItemStatus.RETURNED,
    ReturnStatus.INSPECTED_SELLABLE: OrderItemStatus.RETURNED,
    ReturnStatus.INSPECTED_DAMAGED: OrderItemStatus.RETURNED,
    ReturnStatus.REFUND_ISSUED: OrderItemStatus.REFUND_PROCESSED,
    ReturnStatus.REJECTED: OrderItemStatus.DELIVERED,
    ReturnStatus.CANCELLED: OrderItemStatus.DELIVERED,
}
CARRIERS = ["Delhivery", "Blue Dart", "Ecom Express", "XpressBees"]


class Command(BaseCommand):
    help = "Seed demo customers, delivered orders, returns in every lifecycle stage and A-to-z claims for the demo seller."

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help="Delete previously seeded demo orders/returns first")

    def handle(self, *args, **options):
        if options['reset']:
            orders = Order.objects.filter(order_number__startswith=ORDER_PREFIX)
            with transaction.atomic():
                ReturnRequest.objects.filter(order_item__order__in=orders).delete()
                AtoZClaim.objects.filter(order__in=orders).delete()
                OrderItem.objects.filter(order__in=orders).delete()
                count = orders.count()
                orders.delete()
            self.stdout.write(f"Removed {count} seeded orders.")
        seller = resolve_request_seller(None)
        if not seller:
            self.stderr.write(self.style.ERROR("No seller found. Run seed_sample_products first."))
            return
        if Order.objects.filter(order_number__startswith=ORDER_PREFIX).exists():
            self.stdout.write("Return demo data already present, nothing to do.")
            return
        listings = list(Listing.objects.filter(seller=seller).select_related('product'))
        if not listings:
            self.stderr.write(self.style.ERROR("The seller has no listings to build orders from."))
            return

        rng = random.Random(42)
        now = timezone.now()
        with transaction.atomic():
            customers = [self._customer(*c) for c in CUSTOMERS]
            orders_needed = len(RETURN_PLAN) + 100  # orders without returns keep the return rate realistic (~12%)
            items = []
            for n in range(orders_needed):
                user, address = customers[n % len(customers)]
                listing = listings[n % len(listings)]
                placed = now - timedelta(days=rng.randint(4, 45), hours=rng.randint(0, 23))
                items.append(self._delivered_order(n, user, address, listing, seller, placed, rng))

            for i, (rstatus, reason, fee) in enumerate(RETURN_PLAN):
                item = items[i]
                created = item.order.placed_at + timedelta(days=rng.randint(3, 6))
                total = item.total_price
                rr = ReturnRequest.objects.create(
                    rma_number=f"RMA-{700100 + i}",
                    order_item=item,
                    seller=seller,
                    reason=reason,
                    customer_comment=COMMENTS.get(reason),
                    evidence_images=[item.listing.product.images.first().image_url]
                    if reason in (ReturnReason.SHIPPING_BOX_AND_ITEM_DAMAGED, ReturnReason.DEFECTIVE_OR_DOES_NOT_WORK)
                    and item.listing.product.images.exists() else [],
                    status=rstatus,
                    restocking_fee_rate=Decimal(fee),
                    refund_amount=(total - total * Decimal(fee) / 100).quantize(Decimal('0.01'))
                    if rstatus == ReturnStatus.REFUND_ISSUED else total,
                    refunded_at=created + timedelta(days=6) if rstatus == ReturnStatus.REFUND_ISSUED else None,
                    return_carrier=rng.choice(CARRIERS) if rstatus in SHIPPED_STATUSES else None,
                    return_tracking_number=f"RT{rng.randint(10**9, 10**10 - 1)}" if rstatus in SHIPPED_STATUSES else None,
                )
                ReturnRequest.objects.filter(pk=rr.pk).update(
                    created_at=created, updated_at=min(now, created + timedelta(days=rng.randint(0, 5)))
                )
                item.status = ITEM_STATUS_FOR.get(rstatus, OrderItemStatus.RETURN_REQUESTED)
                item.save(update_fields=['status'])
                if rstatus == ReturnStatus.REFUND_ISSUED:
                    Order.objects.filter(pk=item.order_id).update(status=OrderStatus.REFUNDED)
                    Payment.objects.filter(order_id=item.order_id).update(status=PaymentStatus.REFUNDED)

            claim_plan = [
                (AtoZClaimStatus.WAITING_FOR_SELLER_RESPONSE, "Item not received", "Tracking shows delivered but nothing reached our site office."),
                (AtoZClaimStatus.FILED, "Item materially different", "Received a lower grade of cement than what was listed."),
                (AtoZClaimStatus.UNDER_INVESTIGATION, "Return refund not received", "Returned the item two weeks ago, still no refund."),
                (AtoZClaimStatus.CLAIM_DENIED, "Late delivery", "Order arrived a day late."),
            ]
            for i, (cstatus, reason, story) in enumerate(claim_plan):
                item = items[len(RETURN_PLAN) + i]
                claim = AtoZClaim.objects.create(
                    claim_number=f"ATOZ-{781900 + i}",
                    order=item.order,
                    customer=item.order.customer,
                    seller=seller,
                    claim_reason=reason,
                    buyer_explanation=story,
                    status=cstatus,
                    seller_response_text="Shared the signed proof of delivery and gate entry slip from the site."
                    if cstatus in (AtoZClaimStatus.UNDER_INVESTIGATION, AtoZClaimStatus.CLAIM_DENIED) else None,
                    seller_responded_at=now - timedelta(days=2)
                    if cstatus in (AtoZClaimStatus.UNDER_INVESTIGATION, AtoZClaimStatus.CLAIM_DENIED) else None,
                    resolved_at=now - timedelta(days=1) if cstatus == AtoZClaimStatus.CLAIM_DENIED else None,
                )
                AtoZClaim.objects.filter(pk=claim.pk).update(created_at=item.order.placed_at + timedelta(days=5))

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {orders_needed} delivered orders, {len(RETURN_PLAN)} returns and {len(claim_plan)} A-to-z claims "
            f"for {seller.display_name}."
        ))

    @staticmethod
    def _customer(name, phone, city, state, pin):
        first, last = name.split(" ", 1)
        user, _ = User.objects.get_or_create(
            phone=phone,
            defaults={"username": f"cust{phone[-4:]}", "first_name": first, "last_name": last, "role": UserRole.CUSTOMER},
        )
        address = user.addresses.first() or Address.objects.create(
            user=user, full_name=name, phone_number=phone, street_line1="Site office, Plot 12",
            city=city, state_or_province=state, postal_code=pin, country_code="IN",
            is_default_shipping=True, is_default_billing=True,
        )
        return user, address

    @staticmethod
    def _delivered_order(n, user, address, listing, seller, placed, rng):
        qty = rng.choice([1, 1, 2, 3, 5])
        unit = listing.sale_price or listing.standard_price
        subtotal = unit * qty
        tax = (subtotal * Decimal('0.18')).quantize(Decimal('0.01'))
        order = Order.objects.create(
            order_number=f"{ORDER_PREFIX}{10001 + n}",
            customer=user, status=OrderStatus.DELIVERED, currency="INR",
            items_subtotal=subtotal, shipping_total=Decimal('0'), tax_total=tax, grand_total=subtotal + tax,
            shipping_address=address, billing_address=address, placed_at=placed, paid_at=placed,
        )
        shipment = Shipment.objects.create(
            shipment_number=f"SHP-SEED-{10001 + n}", order=order, seller=seller, status=ShipmentStatus.DELIVERED,
            carrier_name=rng.choice(CARRIERS), tracking_number=f"FW{rng.randint(10**9, 10**10 - 1)}",
            dispatched_at=placed + timedelta(days=1), delivered_at=placed + timedelta(days=3),
        )
        Payment.objects.create(
            order=order, payment_method=PaymentMethodType.UPI, gateway_provider="RAZORPAY",
            gateway_transaction_id=f"pay_seed_{10001 + n}", amount=order.grand_total, currency="INR",
            status=PaymentStatus.CAPTURED, authorized_at=placed, captured_at=placed,
        )
        return OrderItem.objects.create(
            order=order, listing=listing, seller=seller, shipment=shipment, status=OrderItemStatus.DELIVERED,
            quantity=qty, unit_price=unit, total_price=subtotal, item_tax_amount=tax,
        )
