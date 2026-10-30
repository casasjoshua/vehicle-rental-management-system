
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Clock3,
  Users,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  getCurrentUser,
  getStoredUser,
} from "../services/authService";

import { getDashboardStats } from "../services/dashboardService";

import type { DashboardStats } from "../services/dashboardService";
import type { AuthUser, UserRole } from "../features/auth/types/auth";

interface Stat {
  label: string;
  value: string;
  description: string;
  icon: typeof CarFront;
}

const emptyStats: DashboardStats = {
  totalVehicles: 0,
  totalBookings: 0,
  totalCustomers: 0,
  revenue: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  myBookings: 0,
  totalSpent: 0,
};

function safeNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-PH").format(safeNumber(value));
}

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

function normalizeStats(
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

function getStatsByRole(role: UserRole, data: DashboardStats): Stat[] {
  switch (role) {
    case "ADMIN":
      return [
        {
          label: "Total Vehicles",
          value: formatNumber(data.totalVehicles),
          description: "Vehicles in the fleet",
          icon: CarFront,
        },
        {
          label: "Total Bookings",
          value: formatNumber(data.totalBookings),
          description: "All rental bookings",
          icon: CalendarDays,
        },
        {
          label: "Customers",
          value: formatNumber(data.totalCustomers),
          description: "Registered customers",
          icon: Users,
        },
        {
          label: "Revenue",
          value: formatCurrency(data.revenue),
          description: "Revenue from completed bookings",
          icon: CircleDollarSign,
        },
      ];

    case "STAFF":
      return [
        {
          label: "Fleet Vehicles",
          value: formatNumber(data.totalVehicles),
          description: "Vehicles in the fleet",
          icon: CarFront,
        },
        {
          label: "Bookings",
          value: formatNumber(data.totalBookings),
          description: "All rental bookings",
          icon: CalendarDays,
        },
        {
          label: "Pending Requests",
          value: formatNumber(data.pendingBookings),
          description: "Bookings awaiting action",
          icon: Clock3,
        },
        {
          label: "Confirmed Bookings",
          value: formatNumber(data.confirmedBookings),
          description: "Bookings confirmed for rental",
          icon: Activity,
        },
      ];

    case "CUSTOMER":
    default:
      return [
        {
          label: "My Bookings",
          value: formatNumber(data.myBookings),
          description: "Your rental bookings",
          icon: CalendarDays,
        },
        {
          label: "Confirmed Bookings",
          value: formatNumber(data.confirmedBookings),
          description: "Your confirmed rental bookings",
          icon: CarFront,
        },
        {
          label: "Pending Requests",
          value: formatNumber(data.pendingBookings),
          description: "Your pending bookings",
          icon: Clock3,
        },
        {
          label: "Total Spent",
          value: formatCurrency(data.totalSpent),
          description: "Your completed rental bookings",
          icon: CircleDollarSign,
        },
      ];
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardStats() {
    setLoadingStats(true);
    setError("");

    try {
      const result = await getDashboardStats();
      setStats(normalizeStats(result));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics."
      );
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        // The route guard handles an invalid session.
      })
      .finally(() => {
        if (active) {
          setLoadingUser(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadDashboardStats();
  }, []);

  const role: UserRole = user?.role ?? "CUSTOMER";
  const cards = getStatsByRole(role, stats);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <section>
        <p className="text-sm font-semibold text-blue-600">
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {user?.fullName?.split(" ")[0] || "there"}!
        </h2>

        <p className="mt-2 text-slate-500">
          Here's your {role.toLowerCase()} dashboard overview.
        </p>
      </section>

      {/* Loading indicator */}
      {(loadingUser || loadingStats) && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading dashboard data...
        </div>
      )}

      {/* Error message and retry button */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboardStats()}
            disabled={loadingStats}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Statistics cards */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 break-words text-2xl font-black text-slate-900">
                    {loadingStats ? "—" : stat.value}
                  </p>
                </div>

                <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icon className="h-6 w-6" />
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {stat.description}
              </p>
            </article>
          );
        })}
      </section>

      {/* Account overview */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="text-lg font-black text-slate-900">
            Account overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your signed-in account information.
          </p>

          <div className="mt-6 divide-y divide-slate-100">
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <span className="text-sm text-slate-500">Full name</span>
              <span className="text-sm font-semibold text-slate-900">
                {user?.fullName || (loadingUser ? "Loading..." : "—")}
              </span>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <span className="text-sm text-slate-500">Email</span>
              <span className="break-all text-sm font-semibold text-slate-900">
                {user?.email || "—"}
              </span>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <span className="text-sm text-slate-500">Phone</span>
              <span className="text-sm font-semibold text-slate-900">
                {user?.phone || "Not provided"}
              </span>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <span className="text-sm text-slate-500">Account role</span>
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Information panel */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 p-6 text-white">
          <span className="inline-flex rounded-xl bg-white/15 p-3">
            <CarFront className="h-7 w-7" />
          </span>

          <h3 className="mt-5 text-xl font-black">
            Vehicle Rental System
          </h3>

          <p className="mt-3 text-sm leading-6 text-blue-50">
            {role === "ADMIN"
              ? "Monitor fleet operations, bookings, customers, and business activity."
              : role === "STAFF"
                ? "Manage vehicles and help keep rental bookings organized."
                : "Browse available vehicles and keep track of your rental bookings."}
          </p>

          <p className="mt-6 rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
            Signed in as <strong>{role}</strong>
          </p>
        </div>
      </section>
    </div>
  );
}
