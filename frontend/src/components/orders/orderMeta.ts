export const ORDER_TONE: Record<string, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: "#f1f5f9", fg: "#475569" },
  PAYMENT_CONFIRMED: { bg: "#fef3c7", fg: "#92400e" },
  PROCESSING: { bg: "#dbeafe", fg: "#1e40af" },
  PARTIALLY_SHIPPED: { bg: "#e0e7ff", fg: "#3730a3" },
  SHIPPED: { bg: "#ede9fe", fg: "#5b21b6" },
  DELIVERED: { bg: "#dcfce7", fg: "#166534" },
  CANCELLED: { bg: "#fee2e2", fg: "#991b1b" },
  REFUNDED: { bg: "#ffedd5", fg: "#9a3412" },
};

/** Short label for a payment-confirmed order the seller still has to act on. */
export const ORDER_LABEL: Record<string, string> = {
  PAYMENT_CONFIRMED: "New",
};
