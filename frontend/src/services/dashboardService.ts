import { request } from "./addProductService";

export type DashboardRange = "7d" | "14d" | "30d" | "week" | "month";

export interface RangeInfo {
  key: DashboardRange;
  label: string;
  start: string;
  end: string;
}

export interface MetricCard<T = number> {
  value: T;
  previous: T;
  /** null when the previous period had nothing to compare against */
  change_pct: number | null;
}

export interface DashboardData {
  seller: {
    id: string;
    display_name: string;
    legal_business_name: string;
    store_slug: string;
    account_status: string;
    verification_status: string;
    holiday_mode_enabled: boolean;
    profile_completion: { percent: number; is_complete: boolean; missing: string[] };
  };
  currency: string;
  range: RangeInfo;
  metrics: {
    total_orders: MetricCard;
    total_sales: MetricCard<string>;
    orders_delivered: MetricCard;
    pending_orders: MetricCard;
  };
  sales_overview: {
    total: string;
    previous_total: string;
    change_pct: number | null;
    points: { label: string; date: string; value: string }[];
  };
  recent_orders: {
    order_number: string;
    placed_at: string;
    amount: string;
    currency: string;
    status: string;
    status_display: string;
  }[];
  top_categories: {
    range: RangeInfo;
    items: { rank: number; category_id: string; name: string; amount: string; units: number; percent: number }[];
  };
  sales_by_channel: {
    range: RangeInfo;
    total: string;
    channels: { channel: string; label: string; amount: string; percent: number }[];
  };
  performance: {
    range: RangeInfo;
    score: number | null;
    grade: "GREAT" | "GOOD" | "NEEDS_IMPROVEMENT" | "NO_DATA";
    breakdown: {
      order_fulfillment: number | null;
      customer_feedback: number | null;
      return_rate: number | null;
      on_time_delivery: number | null;
    };
  };
  available_ranges: { key: DashboardRange; label: string }[];
}

export interface DashboardRanges {
  range: DashboardRange;
  categories_range?: DashboardRange;
  channel_range?: DashboardRange;
  performance_range?: DashboardRange;
}

export async function fetchDashboard(ranges: DashboardRanges): Promise<DashboardData> {
  const qs = new URLSearchParams(
    Object.entries(ranges).filter(([, v]) => v) as [string, string][]
  ).toString();
  return request<DashboardData>(`/api/portal/dashboard/?${qs}`);
}
