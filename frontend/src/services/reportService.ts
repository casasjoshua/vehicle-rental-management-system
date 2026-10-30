
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

export type ReportStatusCount = Record<string, number>;

export interface ReportSummary {
  users: {
    total: number;
    byRole: ReportStatusCount;
  };
  vehicles: {
    total: number;
    byStatus: ReportStatusCount;
  };
  bookings: {
    total: number;
    byStatus: ReportStatusCount;
  };
  revenue: number;
}

export interface MonthlyReportItem {
  month: number;
  bookings: number;
  revenue: number;
  completed: number;
  cancelled: number;
}

export interface MonthlyReportResponse {
  year: number;
  months: MonthlyReportItem[];
  totals?: {
    bookings?: number;
    revenue?: number;
    completed?: number;
    cancelled?: number;
  };
}

export interface BookingReportItem {
  id: number;
  bookingNumber?: string;
  userId?: number;
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
  numberOfDays?: number;
  dailyRate?: number | string;
  totalAmount?: number | string;
  status: string;
  createdAt?: string;
  user?: {
    id?: number;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
  vehicle?: {
    id?: number;
    name?: string;
    brand?: string;
    model?: string;
    plateNumber?: string;
  } | null;
  customerName?: string;
  vehicleName?: string;
}

export interface BookingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookingReportResponse {
  bookings: BookingReportItem[];
  pagination: BookingPagination;
}

export interface VehicleReportItem {
  id: number;
  name?: string;
  brand?: string;
  model?: string;
  plateNumber?: string;
  vehicleType?: string;
  dailyRate?: number | string;
  status?: string;
  totalBookings?: number;
  completedBookings?: number;
  activeBookings?: number;
  cancelledBookings?: number;
}

export interface VehicleReportResponse {
  total?: number;
  byStatus?: ReportStatusCount;
  vehicles: VehicleReportItem[];
}

export interface UserReport {
  total: number;
  active: number;
  inactive: number;
  byRole: ReportStatusCount;
}

type RequestParams = Record<string, string | number | undefined>;

async function request<T>(
  endpoint: string,
  params?: RequestParams
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/reports${endpoint}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const token = localStorage.getItem("token");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed with status ${response.status}`
    );
  }

  if (result == null) {
    throw new Error("The reports API returned an empty response.");
  }

  return (result.data ?? result) as T;
}

export const reportService = {
  getSummary: () => request<ReportSummary>("/summary"),

  getMonthly: (year: number) =>
    request<MonthlyReportResponse>("/monthly", { year }),

  getBookings: (options?: {
    page?: number;
    limit?: number;
    status?: string;
    from?: string;
    to?: string;
  }) => request<BookingReportResponse>("/bookings", options),

  getVehicles: () =>
    request<VehicleReportResponse | VehicleReportItem[]>("/vehicles"),

  getUsers: () => request<UserReport>("/users"),
};
