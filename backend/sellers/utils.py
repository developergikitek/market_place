from sellers.models import Seller


def resolve_request_seller(request):
    """
    Seller acting on this request.
    Falls back to the demo store while the seller frontend has no JWT login wired up.
    """
    user = getattr(request, 'user', None)
    seller = getattr(user, 'seller_account', None) if user and user.is_authenticated else None
    return seller or Seller.objects.filter(store_slug='gikitek').first() or Seller.objects.first()
