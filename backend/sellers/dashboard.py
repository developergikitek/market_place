"""
Seller Central home dashboard: KPI cards, sales trend, recent orders, top categories,
sales by commerce channel and a performance score, all scoped to one seller.
"""
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from common.enums import CommerceChannel, OrderItemStatus, OrderStatus
from orders.models import Order, OrderItem, Shipment
from orders.workflow import TABS
from returns.models import ReturnRequest
from reviews.models import SellerFeedback

RANGES = {
    '7d': 'Last 7 Days',
    '14d': 'Last 14 Days',
    '30d': 'Last 30 Days',
    'week': 'This Week',
    'month': 'This Month',
}
DEFAULT_RANGE = '7d'

PENDING_STATUSES = TABS['unshipped'] + [OrderStatus.PARTIALLY_SHIPPED]
FULFILLED_ITEM = {OrderItemStatus.SHIPPED, OrderItemStatus.DELIVERED, OrderItemStatus.RETURN_REQUESTED,
                  OrderItemStatus.RETURNED, OrderItemStatus.REFUND_PROCESSED}


def _money(value):
    return str(Decimal(str(value or 0)).quantize(Decimal('0.01')))


def _change_pct(current, previous):
    """Percent change vs the previous period; None when there is nothing to compare against."""
    current, previous = Decimal(str(current or 0)), Decimal(str(previous or 0))
    if not previous:
        return None
    return float(((current - previous) / previous * 100).quantize(Decimal('0.1')))


def _start_of(day):
    return timezone.make_aware(datetime.combine(day, time.min))


def resolve_range(key):
    """(key, label, start, end, prev_start) for a range key; the previous period has the same length."""
    key = key if key in RANGES else DEFAULT_RANGE
    today = timezone.localdate()
    end = _start_of(today + timedelta(days=1))
    if key == 'week':
        start = _start_of(today - timedelta(days=today.weekday()))
    elif key == 'month':
        start = _start_of(today.replace(day=1))
    else:
        start = _start_of(today - timedelta(days=int(key[:-1]) - 1))
    prev_start = start - (end - start)
    return key, RANGES[key], start, end, prev_start


def _sales_items(seller, start, end):
    """Seller lines that count as sales: placed in [start, end), paid for and not cancelled."""
    return OrderItem.objects.filter(
        seller=seller, order__placed_at__gte=start, order__placed_at__lt=end,
    ).exclude(status=OrderItemStatus.CANCELLED).exclude(order__status=OrderStatus.PENDING_PAYMENT)


def _seller_orders(seller, start, end):
    return Order.objects.filter(items__seller=seller, placed_at__gte=start, placed_at__lt=end).distinct()


def _order_counts(seller, start, end):
    qs = Order.objects.filter(id__in=_seller_orders(seller, start, end).values('id'))
    return qs.aggregate(
        total=Count('id', filter=~Q(status=OrderStatus.PENDING_PAYMENT)),
        delivered=Count('id', filter=Q(status=OrderStatus.DELIVERED)),
        pending=Count('id', filter=Q(status__in=PENDING_STATUSES)),
    )


def build_metrics(seller, start, end, prev_start):
    now, before = _order_counts(seller, start, end), _order_counts(seller, prev_start, start)
    sales = _sales_items(seller, start, end).aggregate(s=Sum('total_price'))['s'] or 0
    prev_sales = _sales_items(seller, prev_start, start).aggregate(s=Sum('total_price'))['s'] or 0
    card = lambda value, prev: {'value': value, 'previous': prev, 'change_pct': _change_pct(value, prev)}
    return {
        'total_orders': card(now['total'], before['total']),
        'total_sales': {'value': _money(sales), 'previous': _money(prev_sales), 'change_pct': _change_pct(sales, prev_sales)},
        'orders_delivered': card(now['delivered'], before['delivered']),
        'pending_orders': card(now['pending'], before['pending']),
    }


def build_sales_overview(seller, key, start, end, prev_start):
    """Daily points; 'month' and '30d' are grouped into weeks so the chart stays readable."""
    daily = dict(
        _sales_items(seller, start, end).annotate(day=TruncDate('order__placed_at'))
        .values_list('day').annotate(s=Sum('total_price')).order_by()
    )
    days = [(start + timedelta(days=i)).date() for i in range((end - start).days)]
    points = []
    if key in ('month', '30d'):
        for i in range(0, len(days), 7):
            chunk = days[i:i + 7]
            label = f"{chunk[0].strftime('%d %b')}" if len(chunk) == 1 else f"{chunk[0].strftime('%d')}-{chunk[-1].strftime('%d %b')}"
            points.append({'label': label, 'date': chunk[0].isoformat(),
                           'value': _money(sum(daily.get(d, 0) for d in chunk))})
    else:
        points = [{'label': d.strftime('%d %b'), 'date': d.isoformat(), 'value': _money(daily.get(d, 0))} for d in days]
    total = sum(daily.values()) if daily else 0
    prev_total = _sales_items(seller, prev_start, start).aggregate(s=Sum('total_price'))['s'] or 0
    return {'total': _money(total), 'previous_total': _money(prev_total),
            'change_pct': _change_pct(total, prev_total), 'points': points}


def build_recent_orders(seller, limit=5):
    orders = Order.objects.filter(items__seller=seller).distinct().order_by('-placed_at')[:limit]
    result = []
    for o in orders:
        seller_total = o.items.filter(seller=seller).aggregate(s=Sum('total_price'))['s']
        result.append({
            'order_number': o.order_number,
            'placed_at': o.placed_at.isoformat(),
            'amount': _money(seller_total),
            'currency': o.currency,
            'status': o.status,
            'status_display': o.get_status_display(),
        })
    return result


def build_top_categories(seller, start, end, limit=5):
    rows = list(
        _sales_items(seller, start, end)
        .values('listing__product__category_id', 'listing__product__category__name')
        .annotate(amount=Sum('total_price'), units=Sum('quantity'))
        .order_by('-amount')
    )
    total = sum(r['amount'] for r in rows) or 0
    return [{
        'rank': i + 1,
        'category_id': r['listing__product__category_id'],
        'name': r['listing__product__category__name'],
        'amount': _money(r['amount']),
        'units': r['units'],
        'percent': round(float(r['amount'] / total * 100), 1) if total else 0,
    } for i, r in enumerate(rows[:limit])]


def build_sales_by_channel(seller, start, end):
    amounts = dict(
        _sales_items(seller, start, end).values_list('listing__commerce_channel')
        .annotate(s=Sum('total_price')).order_by()
    )
    total = sum(amounts.values()) or 0
    return {
        'total': _money(total),
        'channels': [{
            'channel': value,
            'label': label,
            'amount': _money(amounts.get(value, 0)),
            'percent': round(float(amounts.get(value, 0) / total * 100), 1) if total else 0,
        } for value, label in CommerceChannel.choices],
    }


def _score(numerator, denominator):
    return round(numerator / denominator * 100) if denominator else None


def build_performance(seller, start, end):
    """
    0-100 sub-scores for the period; a sub-score is None when there was no activity to judge.
    The overall score averages the sub-scores that exist.
    """
    items = OrderItem.objects.filter(seller=seller, order__placed_at__gte=start, order__placed_at__lt=end) \
        .exclude(order__status=OrderStatus.PENDING_PAYMENT)
    counts = items.aggregate(
        total=Count('id'),
        fulfilled=Count('id', filter=Q(status__in=FULFILLED_ITEM)),
        cancelled=Count('id', filter=Q(status=OrderItemStatus.CANCELLED)),
    )
    judged = counts['fulfilled'] + counts['cancelled']
    returns = ReturnRequest.objects.filter(seller=seller, created_at__gte=start, created_at__lt=end).count()
    delivered = Shipment.objects.filter(seller=seller, delivered_at__gte=start, delivered_at__lt=end)
    on_time = delivered.filter(Q(estimated_delivery_at__isnull=True) | Q(delivered_at__lte=F('estimated_delivery_at'))).count()
    rating = SellerFeedback.objects.filter(seller=seller, created_at__gte=start, created_at__lt=end) \
        .aggregate(avg=Avg('rating'))['avg']

    breakdown = {
        'order_fulfillment': _score(counts['fulfilled'], judged),
        'customer_feedback': round(rating / 5 * 100) if rating is not None else None,
        'return_rate': (100 - min(100, _score(returns, counts['fulfilled']))) if counts['fulfilled'] else None,
        'on_time_delivery': _score(on_time, delivered.count()),
    }
    present = [v for v in breakdown.values() if v is not None]
    score = round(sum(present) / len(present)) if present else None
    if score is None:
        grade = 'NO_DATA'
    elif score >= 80:
        grade = 'GREAT'
    elif score >= 60:
        grade = 'GOOD'
    else:
        grade = 'NEEDS_IMPROVEMENT'
    return {'score': score, 'grade': grade, 'breakdown': breakdown}


def build_seller_summary(seller):
    checks = {
        'store_description': bool(seller.store_description),
        'logo': bool(seller.logo_url),
        'tax_id': bool(seller.tax_identification_num),
        'bank_account': seller.bank_accounts.exists(),
        'kyc_documents': seller.kyc_documents.exists(),
    }
    return {
        'id': seller.id,
        'display_name': seller.display_name,
        'legal_business_name': seller.legal_business_name,
        'store_slug': seller.store_slug,
        'account_status': seller.account_status,
        'verification_status': seller.verification_status,
        'holiday_mode_enabled': seller.holiday_mode_enabled,
        'profile_completion': {
            'percent': round(sum(checks.values()) / len(checks) * 100),
            'is_complete': all(checks.values()),
            'missing': [k for k, done in checks.items() if not done],
        },
    }


def _range_info(key, label, start, end):
    return {'key': key, 'label': label, 'start': start.isoformat(), 'end': end.isoformat()}


def build_dashboard(seller, params):
    """
    `range` drives the KPI cards and sales chart; `categories_range`, `channel_range` and
    `performance_range` let those widgets pick their own period and default to `range`.
    """
    key, label, start, end, prev_start = resolve_range(params.get('range'))
    sections = {}
    for name in ('categories', 'channel', 'performance'):
        sections[name] = resolve_range(params.get(f'{name}_range') or key)

    cat_key, cat_label, cat_start, cat_end, _ = sections['categories']
    ch_key, ch_label, ch_start, ch_end, _ = sections['channel']
    pf_key, pf_label, pf_start, pf_end, _ = sections['performance']
    return {
        'seller': build_seller_summary(seller),
        'currency': 'INR',
        'range': _range_info(key, label, start, end),
        'metrics': build_metrics(seller, start, end, prev_start),
        'sales_overview': build_sales_overview(seller, key, start, end, prev_start),
        'recent_orders': build_recent_orders(seller),
        'top_categories': {'range': _range_info(cat_key, cat_label, cat_start, cat_end),
                           'items': build_top_categories(seller, cat_start, cat_end)},
        'sales_by_channel': {'range': _range_info(ch_key, ch_label, ch_start, ch_end),
                             **build_sales_by_channel(seller, ch_start, ch_end)},
        'performance': {'range': _range_info(pf_key, pf_label, pf_start, pf_end),
                        **build_performance(seller, pf_start, pf_end)},
        'available_ranges': [{'key': k, 'label': v} for k, v in RANGES.items()],
    }
