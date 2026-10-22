from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from sellers.models import Seller, SellerKycDocument, SellerBankAccount
from sellers.serializers import (
    SellerProfileSerializer, SellerKycDocumentSerializer,
    SellerBankAccountSerializer, SellerPerformanceMetricsSerializer
)
from sellers.permissions import IsSellerUser
from sellers.dashboard import build_dashboard

# Import centralized seller portal viewsets
from listings.views import SellerListingViewSet
from catalog.seller_views import SellerProductViewSet, ProductImageUploadView
from returns.views import ReturnRequestViewSet as SellerReturnRequestViewSet, AtoZClaimViewSet as SellerAtoZClaimViewSet


class SellerProfileViewSet(viewsets.ViewSet):
    """
    Seller Store Profile & Settings Management.
    """
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

    def _get_seller(self, request):
        seller = getattr(request.user, 'seller_account', None)
        if not seller:
            return None
        return seller

    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        """
        Retrieve or update the logged-in merchant's store profile.
        """
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Seller account not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            serializer = SellerProfileSerializer(seller)
            return Response(serializer.data)

        serializer = SellerProfileSerializer(seller, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post'])
    def kyc_documents(self, request):
        """
        List or upload KYC identity documents for compliance.
        """
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Seller account not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            docs = seller.kyc_documents.all().order_by('-created_at')
            serializer = SellerKycDocumentSerializer(docs, many=True)
            return Response(serializer.data)

        serializer = SellerKycDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(seller=seller)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post'])
    def bank_accounts(self, request):
        """
        List or add payout bank accounts.
        """
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Seller account not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            accounts = seller.bank_accounts.all().order_by('-is_primary', '-created_at')
            serializer = SellerBankAccountSerializer(accounts, many=True)
            return Response(serializer.data)

        serializer = SellerBankAccountSerializer(data=request.data)
        if serializer.is_valid():
            # If marked primary, unset other primary accounts
            if serializer.validated_data.get('is_primary'):
                seller.bank_accounts.filter(is_primary=True).update(is_primary=False)
            account = serializer.save(seller=seller)
            return Response(SellerBankAccountSerializer(account).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def toggle_holiday_mode(self, request):
        """
        Toggle holiday mode (temporarily hides merchant offers while preserving listings).
        """
        seller = self._get_seller(request)
        seller.holiday_mode_enabled = not seller.holiday_mode_enabled
        seller.save()
        return Response({
            'holiday_mode_enabled': seller.holiday_mode_enabled,
            'message': f"Holiday mode is now {'ENABLED' if seller.holiday_mode_enabled else 'DISABLED'}."
        })


class SellerDashboardView(APIView):
    """
    Seller Central home dashboard in one call.

    GET /api/portal/dashboard/?range=7d|14d|30d|week|month
        optional: categories_range, channel_range, performance_range (default to `range`)
    """
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

    def get(self, request):
        seller = getattr(request.user, 'seller_account', None)
        if not seller:
            return Response({"error": "Seller account not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(build_dashboard(seller, request.query_params))
