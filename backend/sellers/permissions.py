from rest_framework import permissions
from common.enums import SellerAccountStatus

class IsSellerUser(permissions.BasePermission):
    """
    Allows access only to authenticated users who have an active Seller profile.
    """
    message = "You must have an active seller account to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        seller = getattr(request.user, 'seller_account', None)
        if not seller:
            return False
            
        # Admin can always operate, or sellers that are not suspended/banned
        if request.user.role == 'ADMIN' or seller.account_status in [
            SellerAccountStatus.ACTIVE,
            SellerAccountStatus.ONBOARDING,
            SellerAccountStatus.UNDER_REVIEW
        ]:
            return True
            
        return False

    def has_object_permission(self, request, view, obj):
        seller = getattr(request.user, 'seller_account', None)
        if not seller:
            return False
            
        # If object has 'seller' attribute (like Listing)
        if hasattr(obj, 'seller'):
            return obj.seller == seller or request.user.role == 'ADMIN'
            
        # If object is the Seller itself
        if obj == seller:
            return True
            
        return request.user.role == 'ADMIN'
