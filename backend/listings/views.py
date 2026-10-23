from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum
from common.pagination import StandardResultsSetPagination
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from common.enums import ListingStatus, FulfillmentChannel, CommerceChannel, ProductCondition, channels_serving
from listings.models import Listing, ListingTierPrice
from listings.serializers import SellerListingSerializer
from sellers.permissions import IsSellerUser


class SellerListingViewSet(viewsets.ModelViewSet):
    """
    Merchant Listing & Offer Management API.
    Provides complete CRUD operations for sellers to list products,
    update selling prices, manage bulk tier pricing, and stock.
    """
    serializer_class = SellerListingSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

    def get_queryset(self):
        user = self.request.user
        seller = getattr(user, 'seller_account', None)
        
        if getattr(user, 'role', None) == 'ADMIN' and not seller:
            qs = Listing.objects.all()
        elif seller:
            qs = Listing.objects.filter(seller=seller)
        else:
            qs = Listing.objects.none()

        qs = qs.select_related(
            'seller', 'product', 'product__brand', 'product__category'
        ).prefetch_related(
            'b2b_tier_prices',
            'inventory_items',
            'product__images'
        )

        params = self.request.query_params

        # Filter by status (ACTIVE, INACTIVE, ARCHIVED, etc.)
        listing_status = params.get('status')
        if listing_status:
            qs = qs.filter(status=listing_status.upper())
        else:
            # By default exclude ARCHIVED listings
            qs = qs.exclude(status=ListingStatus.ARCHIVED)

        # Search query (SKU, Product Title, ASIN)
        search = params.get('search') or params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(seller_sku__icontains=search) |
                Q(product__title__icontains=search) |
                Q(product__asin__iexact=search)
            )

        # Filter by fulfillment channel
        fulfillment = params.get('fulfillment')
        if fulfillment:
            qs = qs.filter(fulfillment_channel=fulfillment.upper())

        # Filter by commerce channel: QUICK_COMMERCE / BAZAAR also include BOTH (hybrid) listings
        commerce = params.get('commerce_channel')
        if commerce:
            serving = channels_serving(commerce)
            qs = qs.filter(commerce_channel__in=serving) if serving else qs.none()

        return qs.order_by('-updated_at')

    def perform_destroy(self, instance):
        """
        Soft delete by default to protect historical order data integrity.
        """
        # If listing has no order items, can hard delete, otherwise archive
        if hasattr(instance, 'order_items') and instance.order_items.exists():
            instance.status = ListingStatus.ARCHIVED
            instance.save()
        else:
            instance.delete()

    def update(self, request, *args, **kwargs):
        return self._handle_listing_update(request, partial=False)

    def partial_update(self, request, *args, **kwargs):
        return self._handle_listing_update(request, partial=True)

    def _handle_listing_update(self, request, partial=False):
        from decimal import Decimal, InvalidOperation
        listing = self.get_object()
        data = request.data
        errors = {}

        if 'standard_price' in data or 'price' in data:
            p_val = data.get('standard_price', data.get('price'))
            try:
                price = Decimal(str(p_val))
                if not price.is_finite() or price <= 0:
                    raise InvalidOperation
                listing.standard_price = price
            except (InvalidOperation, ValueError, TypeError):
                errors['standard_price'] = "Enter a price greater than zero."

        # Optional money fields: blank/null clears them.
        for field, label in (('sale_price', 'Sale price'), ('minimum_price', 'Minimum price'), ('maximum_price', 'Maximum price')):
            if field in data:
                raw = data.get(field)
                if raw in (None, ''):
                    setattr(listing, field, None)
                    continue
                try:
                    value = Decimal(str(raw))
                    if not value.is_finite() or value <= 0:
                        raise InvalidOperation
                    setattr(listing, field, value)
                except (InvalidOperation, ValueError, TypeError):
                    errors[field] = f"{label} must be greater than zero."

        for field in ('sale_starts_at', 'sale_ends_at', 'restock_date'):
            if field in data:
                raw = data.get(field)
                if raw in (None, ''):
                    setattr(listing, field, None)
                    continue
                parsed = parse_datetime(str(raw)) or (
                    timezone.make_aware(datetime.combine(parse_date(str(raw)), datetime.min.time()))
                    if parse_date(str(raw)) else None
                )
                if parsed is None:
                    errors[field] = "Enter a valid date."
                else:
                    setattr(listing, field, parsed if timezone.is_aware(parsed) else timezone.make_aware(parsed))

        if 'handling_time_days' in data:
            try:
                days = int(data.get('handling_time_days'))
                if not 1 <= days <= 30:
                    raise ValueError
                listing.handling_time_days = days
            except (ValueError, TypeError):
                errors['handling_time_days'] = "Dispatch time must be 1 to 30 days."

        if 'max_order_quantity' in data:
            raw = data.get('max_order_quantity')
            try:
                listing.max_order_quantity = None if raw in (None, '') else int(raw)
                if listing.max_order_quantity is not None and listing.max_order_quantity < 1:
                    raise ValueError
            except (ValueError, TypeError):
                errors['max_order_quantity'] = "Max quantity must be a whole number of at least 1."

        if 'condition' in data:
            condition = str(data.get('condition') or '').upper()
            if condition in ProductCondition.values:
                listing.condition = condition
            else:
                errors['condition'] = "Choose a valid condition."
        if 'condition_note' in data:
            listing.condition_note = str(data.get('condition_note') or '').strip() or None

        if 'status' in data:
            # Unknown UI labels (e.g. "Low Stock") are ignored rather than rejected.
            s_val = str(data.get('status') or '').upper()
            if s_val in ['ACTIVE', 'INACTIVE', 'ARCHIVED']:
                listing.status = s_val

        if 'fulfillment_channel' in data or 'fulfillmentChannel' in data:
            channel = str(data.get('fulfillment_channel') or data.get('fulfillmentChannel') or '').upper()
            if channel in (FulfillmentChannel.MF, 'MAKAANO_FULFILLED', 'MAKAANO'):
                listing.fulfillment_channel = FulfillmentChannel.MF
            elif channel in (FulfillmentChannel.SF, 'SELLER_FULFILLED', 'SELLER'):
                listing.fulfillment_channel = FulfillmentChannel.SF
            else:
                errors['fulfillment_channel'] = "Choose MF (Makaano Fulfilled) or SF (Seller Fulfilled)."

        if 'commerce_channel' in data or 'commerceChannel' in data:
            commerce = str(data.get('commerce_channel') or data.get('commerceChannel') or '').upper()
            if commerce in CommerceChannel.values:
                listing.commerce_channel = commerce
            else:
                errors['commerce_channel'] = "Choose BAZAAR, QUICK_COMMERCE or BOTH."

        if 'seller_sku' in data or 'sku' in data:
            sku = str(data.get('seller_sku') or data.get('sku') or '').strip()
            if not sku:
                errors['seller_sku'] = "SKU can't be empty."
            elif Listing.objects.filter(seller=listing.seller, seller_sku=sku).exclude(pk=listing.pk).exists():
                errors['seller_sku'] = f"You already have another listing with SKU '{sku}'."
            else:
                listing.seller_sku = sku

        # Cross-field rules, checked on the values the listing will end up with.
        if not errors:
            if listing.sale_price is not None and listing.sale_price >= listing.standard_price:
                errors['sale_price'] = "Sale price must be lower than the MRP."
            if listing.minimum_price and listing.maximum_price and listing.minimum_price > listing.maximum_price:
                errors['minimum_price'] = "Minimum price can't be above the maximum price."
            if listing.sale_starts_at and listing.sale_ends_at and listing.sale_ends_at <= listing.sale_starts_at:
                errors['sale_ends_at'] = "Sale must end after it starts."
            if listing.condition != ProductCondition.NEW and 'condition' in data and not listing.condition_note:
                errors['condition_note'] = "Describe the item's condition for used or refurbished stock."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Stock is changed only through /api/inventory/adjust/, which records every movement.
        listing.save()

        serializer = self.get_serializer(listing)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'])
    def tier_prices(self, request, pk=None):
        """
        Replace the B2B quantity tiers: [{"min_quantity": 10, "discounted_price": "390"}, …].
        Each tier needs 2+ units, a unique quantity, and a unit price below the current selling price.
        """
        from decimal import Decimal, InvalidOperation
        from django.db import transaction

        listing = self.get_object()
        tiers = request.data if isinstance(request.data, list) else request.data.get('tiers')
        if not isinstance(tiers, list):
            return Response({'tiers': "Send a list of tiers."}, status=status.HTTP_400_BAD_REQUEST)
        effective = listing.sale_price or listing.standard_price
        clean, seen, errors = [], set(), []
        for i, tier in enumerate(tiers, start=1):
            try:
                qty = int(tier.get('min_quantity'))
                price = Decimal(str(tier.get('discounted_price')))
            except (InvalidOperation, ValueError, TypeError, AttributeError):
                errors.append(f"Tier {i}: enter a quantity and a price.")
                continue
            if qty < 2:
                errors.append(f"Tier {i}: quantity must be at least 2.")
            elif qty in seen:
                errors.append(f"Tier {i}: {qty}+ units is already a tier.")
            elif not price.is_finite() or price <= 0 or price >= effective:
                errors.append(f"Tier {i}: price must be above 0 and below the selling price (₹{effective}).")
            else:
                seen.add(qty)
                clean.append((qty, price))
        if errors:
            return Response({'tiers': errors}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            listing.b2b_tier_prices.all().delete()
            ListingTierPrice.objects.bulk_create([
                ListingTierPrice(listing=listing, min_quantity=q, discounted_price=p) for q, p in sorted(clean)
            ])
        return Response(self.get_serializer(self.get_queryset().get(pk=listing.pk)).data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Quickly toggle between ACTIVE and INACTIVE states (pause/resume listing).
        """
        listing = self.get_object()
        if listing.status == ListingStatus.ACTIVE:
            listing.status = ListingStatus.INACTIVE
        else:
            listing.status = ListingStatus.ACTIVE
        listing.save()
        return Response({
            'id': listing.id,
            'seller_sku': listing.seller_sku,
            'status': listing.status,
            'message': f"Listing is now {listing.status}."
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Dashboard overview numbers for the merchant.
        """
        qs = self.get_queryset()
        total_listings = qs.count()
        active_listings = qs.filter(status=ListingStatus.ACTIVE).count()
        buy_box_winners = qs.filter(is_buy_box_winner=True).count()
        
        # Calculate total available stock across all listings
        total_stock = qs.aggregate(total=Sum('inventory_items__available_stock'))['total'] or 0
        
        # Out of stock listings
        out_of_stock = qs.filter(Q(inventory_items__available_stock__lte=0) | Q(inventory_items__isnull=True)).distinct().count()

        by_channel = dict(qs.values_list('commerce_channel').annotate(n=Count('id')).order_by())

        return Response({
            'total_listings': total_listings,
            'active_listings': active_listings,
            'out_of_stock_listings': out_of_stock,
            'buy_box_winners': buy_box_winners,
            'total_stock_units': total_stock,
            'listings_by_commerce_channel': {ch: by_channel.get(ch, 0) for ch in CommerceChannel.values},
            'on_sale_listings': qs.filter(sale_price__isnull=False).count(),
            'inactive_listings': qs.filter(status=ListingStatus.INACTIVE).count(),
        })
