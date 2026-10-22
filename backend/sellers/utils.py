from sellers.models import Seller


def resolve_request_seller(request):
    """
    Seller acting on this request.
    Must be an authenticated user with an associated Seller profile.
    """
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        seller = getattr(user, 'seller_account', None)
        if seller:
            return seller
        if getattr(user, 'role', None) == 'ADMIN':
            return Seller.objects.first()
    return None
