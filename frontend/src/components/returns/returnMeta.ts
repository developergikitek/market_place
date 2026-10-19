import type { ClaimStatus, ReturnAction, ReturnStatus } from "@/services/returnsService";

export const STATUS_TONE: Record<ReturnStatus, { bg: string; fg: string }> = {
  REQUESTED: { bg: "#fef3c7", fg: "#92400e" },
  SELLER_APPROVED: { bg: "#dbeafe", fg: "#1e40af" },
  AUTO_AUTHORIZED: { bg: "#dbeafe", fg: "#1e40af" },
  RETURN_LABEL_GENERATED: { bg: "#e0e7ff", fg: "#3730a3" },
  IN_TRANSIT_TO_FC: { bg: "#ede9fe", fg: "#5b21b6" },
  DELIVERED_TO_FC: { bg: "#ccfbf1", fg: "#115e59" },
  INSPECTED_SELLABLE: { bg: "#dcfce7", fg: "#166534" },
  INSPECTED_DAMAGED: { bg: "#ffedd5", fg: "#9a3412" },
  REFUND_ISSUED: { bg: "#dcfce7", fg: "#14532d" },
  REJECTED: { bg: "#fee2e2", fg: "#991b1b" },
  CANCELLED: { bg: "#f1f5f9", fg: "#475569" },
};

export const CLAIM_TONE: Record<ClaimStatus, { bg: string; fg: string }> = {
  FILED: { bg: "#fef3c7", fg: "#92400e" },
  WAITING_FOR_SELLER_RESPONSE: { bg: "#fee2e2", fg: "#991b1b" },
  UNDER_INVESTIGATION: { bg: "#e0e7ff", fg: "#3730a3" },
  GRANTED_BUYER_REFUNDED_BY_SELLER: { bg: "#ffedd5", fg: "#9a3412" },
  GRANTED_BUYER_FUNDED_BY_BUILDMART: { bg: "#dcfce7", fg: "#166534" },
  GRANTED_BUYER_FUNDED_BY_AMAZON: { bg: "#dcfce7", fg: "#166534" },
  CLAIM_DENIED: { bg: "#f1f5f9", fg: "#475569" },
  WITHDRAWN: { bg: "#f1f5f9", fg: "#475569" },
};

/** Lifecycle shown in the drawer stepper; each status maps to the step it has reached. */
export const STEPS = ["Requested", "Authorized", "Label", "In transit", "At warehouse", "Inspected", "Refunded"];
export const STEP_OF: Partial<Record<ReturnStatus, number>> = {
  REQUESTED: 0,
  SELLER_APPROVED: 1,
  AUTO_AUTHORIZED: 1,
  RETURN_LABEL_GENERATED: 2,
  IN_TRANSIT_TO_FC: 3,
  DELIVERED_TO_FC: 4,
  INSPECTED_SELLABLE: 5,
  INSPECTED_DAMAGED: 5,
  REFUND_ISSUED: 6,
};

/** Label for the row's call-to-action, from the first action the seller can take. */
export const ACTION_CTA: Record<ReturnAction, string> = {
  approve: "Review",
  reject: "Review",
  generate_label: "Add shipment",
  mark_in_transit: "Mark shipped",
  mark_received: "Mark received",
  inspect: "Inspect",
  issue_refund: "Issue refund",
};

export const CARRIERS = ["Delhivery", "Blue Dart", "Ecom Express", "XpressBees", "DTDC", "India Post", "Shadowfax"];

// Whole rupees stay whole (₹3,999); anything with paise shows both digits (₹7,183.40).
export const formatINR = (value: string | number) => {
  const n = Number(value);
  const paise = !Number.isInteger(Math.round(n * 100) / 100);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: paise ? 2 : 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (iso: string | null, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "—";
