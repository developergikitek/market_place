from django.db import models

class UserRole(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    SELLER = "SELLER", "Seller"
    ADMIN = "ADMIN", "Admin"
    SUPPORT_AGENT = "SUPPORT_AGENT", "Support Agent"
    WAREHOUSE_OPERATOR = "WAREHOUSE_OPERATOR", "Warehouse Operator"

class VerificationStatus(models.TextChoices):
    UNVERIFIED = "UNVERIFIED", "Unverified"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"

class SellerTier(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", "Individual"
    PROFESSIONAL = "PROFESSIONAL", "Professional"
    ENTERPRISE = "ENTERPRISE", "Enterprise"

class SellerAccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    ONBOARDING = "ONBOARDING", "Onboarding"
    VACATION_MODE = "VACATION_MODE", "Vacation Mode"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    SUSPENDED = "SUSPENDED", "Suspended"
    TERMINATED = "TERMINATED", "Terminated"

class KycDocumentType(models.TextChoices):
    PASSPORT = "PASSPORT", "Passport"
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    DRIVERS_LICENSE = "DRIVERS_LICENSE", "Driver's License"
    BUSINESS_REGISTRATION_CERTIFICATE = "BUSINESS_REGISTRATION_CERTIFICATE", "Business Registration Certificate"
    TAX_IDENTIFICATION_CERTIFICATE = "TAX_IDENTIFICATION_CERTIFICATE", "Tax Identification Certificate"
    UTILITY_BILL = "UTILITY_BILL", "Utility Bill"
    BANK_ACCOUNT_STATEMENT = "BANK_ACCOUNT_STATEMENT", "Bank Account Statement"

class ProductCondition(models.TextChoices):
    NEW = "NEW", "New"
    REFURBISHED_EXCELLENT = "REFURBISHED_EXCELLENT", "Refurbished - Excellent"
    REFURBISHED_GOOD = "REFURBISHED_GOOD", "Refurbished - Good"
    USED_LIKE_NEW = "USED_LIKE_NEW", "Used - Like New"
    USED_VERY_GOOD = "USED_VERY_GOOD", "Used - Very Good"
    USED_GOOD = "USED_GOOD", "Used - Good"
    USED_ACCEPTABLE = "USED_ACCEPTABLE", "Used - Acceptable"
    COLLECTIBLE = "COLLECTIBLE", "Collectible"

class FulfillmentChannel(models.TextChoices):
    FBA = "FBA", "Fulfillment by Buildmart"
    FBM = "FBM", "Fulfillment by Merchant"

class CommerceChannel(models.TextChoices):
    BAZAAR = "BAZAAR", "Bazaar (Pan-India)"
    QUICK_COMMERCE = "QUICK_COMMERCE", "Quick Commerce (Local)"
    BOTH = "BOTH", "Both (Bazaar & Quick Commerce)"


def channels_serving(channel):
    """
    Stored commerce channels whose listings reach buyers on `channel` (a BOTH listing serves Bazaar and
    Quick Commerce). Returns None for an unknown channel.
    """
    channel = str(channel or '').upper()
    if channel == CommerceChannel.BOTH:
        return [CommerceChannel.BOTH]
    if channel in CommerceChannel.values:
        return [channel, CommerceChannel.BOTH]
    return None

class ListingStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    OUT_OF_STOCK = "OUT_OF_STOCK", "Out of Stock"
    SUPPRESSED = "SUPPRESSED", "Suppressed"
    BLOCKED = "BLOCKED", "Blocked"
    DRAFT = "DRAFT", "Draft"
    ARCHIVED = "ARCHIVED", "Archived"

class VariationTheme(models.TextChoices):
    SIZE = "SIZE", "Size"
    COLOR = "COLOR", "Color"
    SIZE_COLOR = "SIZE_COLOR", "Size and Color"
    STYLE = "STYLE", "Style"
    FLAVOR = "FLAVOR", "Flavor"
    SCENT = "SCENT", "Scent"
    CAPACITY = "CAPACITY", "Capacity"
    MATERIAL = "MATERIAL", "Material"
    COUNT_PER_PACK = "COUNT_PER_PACK", "Count per Pack"

class CatalogStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
    ACTIVE = "ACTIVE", "Active"
    SUPPRESSED = "SUPPRESSED", "Suppressed"
    DISCONTINUED = "DISCONTINUED", "Discontinued"

class WarehouseType(models.TextChoices):
    FBA_FULFILLMENT_CENTER = "FBA_FULFILLMENT_CENTER", "Buildmart Fulfillment Center"
    SORTATION_CENTER = "SORTATION_CENTER", "Sortation Center"
    DELIVERY_STATION = "DELIVERY_STATION", "Delivery Station"
    SELLER_WAREHOUSE = "SELLER_WAREHOUSE", "Seller Warehouse"
    CROSS_DOCK_FACILITY = "CROSS_DOCK_FACILITY", "Cross Dock Facility"

class InboundShipmentStatus(models.TextChoices):
    WORKING = "WORKING", "Working"
    SHIPPED = "SHIPPED", "Shipped"
    IN_TRANSIT = "IN_TRANSIT", "In Transit"
    DELIVERED = "DELIVERED", "Delivered"
    CHECKED_IN = "CHECKED_IN", "Checked In"
    RECEIVING = "RECEIVING", "Receiving"
    CLOSED = "CLOSED", "Closed"
    CANCELLED = "CANCELLED", "Cancelled"

class InventoryMovementReason(models.TextChoices):
    CUSTOMER_ORDER_RESERVED = "CUSTOMER_ORDER_RESERVED", "Customer Order Reserved"
    CUSTOMER_ORDER_DISPATCHED = "CUSTOMER_ORDER_DISPATCHED", "Customer Order Dispatched"
    CUSTOMER_RETURN_RESTOCKED = "CUSTOMER_RETURN_RESTOCKED", "Customer Return Restocked"
    FBA_INBOUND_RECEIVED = "FBA_INBOUND_RECEIVED", "FBA Inbound Received"
    DAMAGED_IN_WAREHOUSE = "DAMAGED_IN_WAREHOUSE", "Damaged in Warehouse"
    CYCLE_COUNT_ADJUSTMENT = "CYCLE_COUNT_ADJUSTMENT", "Cycle Count Adjustment"
    DISPOSED = "DISPOSED", "Disposed"
    STOCK_TRANSFER_INTER_WAREHOUSE = "STOCK_TRANSFER_INTER_WAREHOUSE", "Stock Transfer Inter-Warehouse"
    SELLER_REMOVAL_ORDER = "SELLER_REMOVAL_ORDER", "Seller Removal Order"

class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT", "Pending Payment"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED", "Payment Confirmed"
    PROCESSING = "PROCESSING", "Processing"
    PARTIALLY_SHIPPED = "PARTIALLY_SHIPPED", "Partially Shipped"
    SHIPPED = "SHIPPED", "Shipped"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"
    REFUNDED = "REFUNDED", "Refunded"

class OrderItemStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ALLOCATED = "ALLOCATED", "Allocated"
    PACKED = "PACKED", "Packed"
    SHIPPED = "SHIPPED", "Shipped"
    DELIVERED = "DELIVERED", "Delivered"
    RETURN_REQUESTED = "RETURN_REQUESTED", "Return Requested"
    RETURNED = "RETURNED", "Returned"
    CANCELLED = "CANCELLED", "Cancelled"
    REFUND_PROCESSED = "REFUND_PROCESSED", "Refund Processed"

class ShippingSpeed(models.TextChoices):
    STANDARD = "STANDARD", "Standard (3-5 Days)"
    EXPEDITED = "EXPEDITED", "Expedited (2 Days)"
    PRIME_TWO_DAY = "PRIME_TWO_DAY", "Prime Two-Day"
    PRIME_ONE_DAY = "PRIME_ONE_DAY", "Prime One-Day"
    PRIME_SAME_DAY = "PRIME_SAME_DAY", "Prime Same-Day"

class ShipmentStatus(models.TextChoices):
    LABEL_CREATED = "LABEL_CREATED", "Label Created"
    READY_FOR_PICKUP = "READY_FOR_PICKUP", "Ready for Pickup"
    PICKED_UP = "PICKED_UP", "Picked Up"
    IN_TRANSIT = "IN_TRANSIT", "In Transit"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
    DELIVERY_ATTEMPTED = "DELIVERY_ATTEMPTED", "Delivery Attempted"
    DELIVERED = "DELIVERED", "Delivered"
    EXCEPTION_RETURNED = "EXCEPTION_RETURNED", "Exception Returned"
    LOST_IN_TRANSIT = "LOST_IN_TRANSIT", "Lost in Transit"

class PaymentMethodType(models.TextChoices):
    CREDIT_CARD = "CREDIT_CARD", "Credit Card"
    DEBIT_CARD = "DEBIT_CARD", "Debit Card"
    BUILDMART_WALLET = "BUILDMART_WALLET", "Buildmart Balance / Wallet"
    AMAZON_PAY_BALANCE = "AMAZON_PAY_BALANCE", "Buildmart Balance / Wallet"
    NET_BANKING = "NET_BANKING", "Net Banking"
    UPI = "UPI", "UPI"
    DIGITAL_WALLET = "DIGITAL_WALLET", "Digital Wallet"
    BUY_NOW_PAY_LATER = "BUY_NOW_PAY_LATER", "Buy Now Pay Later"
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY", "Cash on Delivery"

class PaymentStatus(models.TextChoices):
    INITIATED = "INITIATED", "Initiated"
    AUTHORIZED = "AUTHORIZED", "Authorized"
    CAPTURED = "CAPTURED", "Captured"
    FAILED = "FAILED", "Failed"
    VOIDED = "VOIDED", "Voided"
    REFUNDED = "REFUNDED", "Refunded"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED", "Partially Refunded"

class SettlementStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    PROCESSING = "PROCESSING", "Processing"
    DISBURSED = "DISBURSED", "Disbursed"
    FAILED = "FAILED", "Failed"

class TransactionType(models.TextChoices):
    PRODUCT_SALE = "PRODUCT_SALE", "Product Sale"
    REFERRAL_FEE = "REFERRAL_FEE", "Referral Fee"
    CLOSING_FEE = "CLOSING_FEE", "Closing Fee"
    FBA_PICK_AND_PACK_FEE = "FBA_PICK_AND_PACK_FEE", "FBA Pick and Pack Fee"
    FBA_MONTHLY_STORAGE_FEE = "FBA_MONTHLY_STORAGE_FEE", "FBA Monthly Storage Fee"
    FBA_LONG_TERM_STORAGE_FEE = "FBA_LONG_TERM_STORAGE_FEE", "FBA Long-Term Storage Fee"
    REFUND_DEDUCTION = "REFUND_DEDUCTION", "Refund Deduction"
    REFUND_ADMIN_FEE = "REFUND_ADMIN_FEE", "Refund Admin Fee"
    ADVERTISING_SPEND_DEBIT = "ADVERTISING_SPEND_DEBIT", "Advertising Spend Debit"
    SUBSCRIPTION_FEE = "SUBSCRIPTION_FEE", "Subscription Fee"
    PAYOUT_DISBURSEMENT = "PAYOUT_DISBURSEMENT", "Payout Disbursement"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT", "Manual Adjustment"

class ReturnReason(models.TextChoices):
    DEFECTIVE_OR_DOES_NOT_WORK = "DEFECTIVE_OR_DOES_NOT_WORK", "Defective or Does Not Work"
    WRONG_ITEM_SENT = "WRONG_ITEM_SENT", "Wrong Item Sent"
    ITEM_NOT_AS_DESCRIBED = "ITEM_NOT_AS_DESCRIBED", "Item Not as Described"
    ACCIDENTAL_ORDER = "ACCIDENTAL_ORDER", "Accidental Order"
    FOUND_BETTER_PRICE = "FOUND_BETTER_PRICE", "Found Better Price"
    MISSING_PARTS_OR_ACCESSORIES = "MISSING_PARTS_OR_ACCESSORIES", "Missing Parts or Accessories"
    SHIPPING_BOX_AND_ITEM_DAMAGED = "SHIPPING_BOX_AND_ITEM_DAMAGED", "Shipping Box and Item Damaged"
    ARRIVED_TOO_LATE = "ARRIVED_TOO_LATE", "Arrived Too Late"
    UNAUTHORIZED_PURCHASE = "UNAUTHORIZED_PURCHASE", "Unauthorized Purchase"

class ReturnStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    SELLER_APPROVED = "SELLER_APPROVED", "Seller Approved"
    AUTO_AUTHORIZED = "AUTO_AUTHORIZED", "Auto Authorized"
    RETURN_LABEL_GENERATED = "RETURN_LABEL_GENERATED", "Return Label Generated"
    IN_TRANSIT_TO_FC = "IN_TRANSIT_TO_FC", "In Transit to FC"
    DELIVERED_TO_FC = "DELIVERED_TO_FC", "Delivered to FC"
    INSPECTED_SELLABLE = "INSPECTED_SELLABLE", "Inspected Sellable"
    INSPECTED_DAMAGED = "INSPECTED_DAMAGED", "Inspected Damaged"
    REFUND_ISSUED = "REFUND_ISSUED", "Refund Issued"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"

class AtoZClaimStatus(models.TextChoices):
    FILED = "FILED", "Filed"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION", "Under Investigation"
    WAITING_FOR_SELLER_RESPONSE = "WAITING_FOR_SELLER_RESPONSE", "Waiting for Seller Response"
    GRANTED_BUYER_REFUNDED_BY_SELLER = "GRANTED_BUYER_REFUNDED_BY_SELLER", "Granted - Buyer Refunded by Seller"
    GRANTED_BUYER_FUNDED_BY_BUILDMART = "GRANTED_BUYER_FUNDED_BY_BUILDMART", "Granted - Buyer Funded by Buildmart"
    GRANTED_BUYER_FUNDED_BY_AMAZON = "GRANTED_BUYER_FUNDED_BY_AMAZON", "Granted - Buyer Funded by Buildmart"
    CLAIM_DENIED = "CLAIM_DENIED", "Claim Denied"
    WITHDRAWN = "WITHDRAWN", "Withdrawn"

class AdKeywordMatchType(models.TextChoices):
    EXACT = "EXACT", "Exact"
    PHRASE = "PHRASE", "Phrase"
    BROAD = "BROAD", "Broad"
    NEGATIVE_EXACT = "NEGATIVE_EXACT", "Negative Exact"
    NEGATIVE_PHRASE = "NEGATIVE_PHRASE", "Negative Phrase"

class CampaignStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    PAUSED = "PAUSED", "Paused"
    ENDED = "ENDED", "Ended"
    OUT_OF_BUDGET = "OUT_OF_BUDGET", "Out of Budget"
