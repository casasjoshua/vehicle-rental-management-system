
export interface DashboardStats {
  totalVehicles: number;
  totalBookings: number;
  totalCustomers: number;
  revenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  myBookings: number;
  totalSpent: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function safeNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function normalizeDashboardStats(
  data: Partial<DashboardStats> | null | undefined
): DashboardStats {
  return {
    totalVehicles: safeNumber(data?.totalVehicles),
    totalBookings: safeNumber(data?.totalBookings),
    totalCustomers: safeNumber(data?.totalCustomers),
    revenue: safeNumber(data?.revenue),
    pendingBookings: safeNumber(data?.pendingBookings),
    confirmedBookings: safeNumber(data?.confirmedBookings),
    myBookings: safeNumber(data?.myBookings),
    totalSpent: safeNumber(data?.totalSpent),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your backend."
    );
  }

  const result = (await response.json().catch(() => null)) as
    | ApiResponse<Partial<DashboardStats>>
    | null;

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || "Failed to load dashboard statistics."
    );
  }

  return normalizeDashboardStats(result.data);
}
