"""
Return (RMA) lifecycle rules shared by the API and serializers.

REQUESTED ─approve─▶ SELLER_APPROVED ─┐
REQUESTED ─reject──▶ REJECTED         ├─label─▶ RETURN_LABEL_GENERATED ─ship─▶ IN_TRANSIT_TO_FC ─receive─▶ DELIVERED_TO_FC
(MF lines start at AUTO_AUTHORIZED) ─┘
DELIVERED_TO_FC ─inspect─▶ INSPECTED_SELLABLE (restocked) | INSPECTED_DAMAGED ─refund─▶ REFUND_ISSUED
The buyer can cancel any time before the parcel ships.
"""
from common.enums import ReturnReason, ReturnStatus

# Restocking fees are only fair when the buyer simply changed their mind (or the item came back damaged).
BUYER_REMORSE_REASONS = {ReturnReason.ACCIDENTAL_ORDER, ReturnReason.FOUND_BETTER_PRICE}
MAX_RESTOCKING_FEE_RATE = 20
MAX_DAMAGED_FEE_RATE = 50

# action -> (statuses it can run from, status it moves to; None = decided by the action's input)
TRANSITIONS = {
    'approve': ({ReturnStatus.REQUESTED}, ReturnStatus.SELLER_APPROVED),
    'reject': ({ReturnStatus.REQUESTED}, ReturnStatus.REJECTED),
    'generate_label': ({ReturnStatus.SELLER_APPROVED, ReturnStatus.AUTO_AUTHORIZED}, ReturnStatus.RETURN_LABEL_GENERATED),
    'mark_in_transit': ({ReturnStatus.RETURN_LABEL_GENERATED}, ReturnStatus.IN_TRANSIT_TO_FC),
    'mark_received': ({ReturnStatus.IN_TRANSIT_TO_FC}, ReturnStatus.DELIVERED_TO_FC),
    'inspect': ({ReturnStatus.DELIVERED_TO_FC}, None),
    'issue_refund': ({ReturnStatus.INSPECTED_SELLABLE, ReturnStatus.INSPECTED_DAMAGED}, ReturnStatus.REFUND_ISSUED),
    'cancel': ({ReturnStatus.REQUESTED, ReturnStatus.SELLER_APPROVED, ReturnStatus.AUTO_AUTHORIZED,
                ReturnStatus.RETURN_LABEL_GENERATED}, ReturnStatus.CANCELLED),
}

# Seller-facing groups used by the page tabs and the summary.
STATUS_GROUPS = {
    'action_required': [ReturnStatus.REQUESTED, ReturnStatus.DELIVERED_TO_FC,
                        ReturnStatus.INSPECTED_SELLABLE, ReturnStatus.INSPECTED_DAMAGED],
    'in_progress': [ReturnStatus.SELLER_APPROVED, ReturnStatus.AUTO_AUTHORIZED,
                    ReturnStatus.RETURN_LABEL_GENERATED, ReturnStatus.IN_TRANSIT_TO_FC],
    'completed': [ReturnStatus.REFUND_ISSUED],
    'closed': [ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
}


def allowed_actions(return_request):
    """Seller actions valid for this return right now (cancel is the buyer's, so it is left out)."""
    return [
        action for action, (sources, _) in TRANSITIONS.items()
        if action != 'cancel' and return_request.status in sources
    ]
