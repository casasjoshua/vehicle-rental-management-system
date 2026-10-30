
import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  Bell,
  CalendarDays,
  CarFront,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getStoredUser,
  logoutUser,
} from "../services/authService";
import type { UserRole } from "../features/auth/types/auth";

const menus: Record<
  UserRole,
  { label: string; path: string; icon: typeof LayoutDashboard }[]
> = {
  ADMIN: [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Vehicles", path: "/dashboard/vehicles", icon: CarFront },
    { label: "Bookings", path: "/dashboard/bookings", icon: CalendarDays },
    { label: "Users", path: "/dashboard/users", icon: Users },
    { label: "Reports", path: "/dashboard/reports", icon: Activity },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
  ],
  STAFF: [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Vehicles", path: "/dashboard/vehicles", icon: CarFront },
    { label: "Bookings", path: "/dashboard/bookings", icon: CalendarDays },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
  ],
  CUSTOMER: [
    { label: "My Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      label: "Browse Vehicles",
      path: "/dashboard/browse-vehicles",
      icon: CarFront,
    },
    { label: "My Bookings", path: "/dashboard/bookings", icon: CalendarDays },
    { label: "My Account", path: "/dashboard/settings", icon: Settings },
  ],
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "New booking request",
    message: "A customer has submitted a vehicle booking request.",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Booking approved",
    message: "A vehicle booking has been approved successfully.",
    time: "30 minutes ago",
    read: false,
  },
  {
    id: 3,
    title: "Vehicle updated",
    message: "Vehicle information has been updated.",
    time: "1 hour ago",
    read: true,
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Notification state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  const notificationRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "CUSTOMER";
  const navigation = menus[role] ?? menus.CUSTOMER;

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      toast.success("You have been logged out.");
    } catch {
      toast.error("Logout request failed.");
    } finally {
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  }

  function renderNavigation() {
    return (
      <nav className="space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  function removeNotification(id: number) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  // Close the notification dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close the dropdown when the user presses Escape.
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3"
          >
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <CarFront className="h-6 w-6" />
            </span>

            <span className="text-xl font-black tracking-tight text-slate-900">
              DriveEase
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-5 py-6">
          <p className="mb-4 px-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            Workspace
          </p>

          {renderNavigation()}
        </div>

        {/* Sidebar user and logout */}
        <div className="mt-auto border-t border-slate-100 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.fullName || "User"}
              </p>

              <p className="text-xs font-semibold text-slate-500">
                {role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Vehicle Rental Management
              </p>

              <h1 className="text-lg font-black text-slate-900">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notification bell and dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen((isOpen) => !isOpen)
                }
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                aria-label={`Notifications${
                  unreadCount > 0 ? `, ${unreadCount} unread` : ""
                }`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  {/* Dropdown heading */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${
                              unreadCount === 1 ? "" : "s"
                            }`
                          : "You're all caught up"}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        <CheckCheck className="h-4 w-4" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Notification items */}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <Bell className="h-5 w-5 text-slate-400" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          New updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`group flex gap-3 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50 ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="relative mt-1 shrink-0">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                !notification.read
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Bell className="h-4 w-4" />
                            </div>

                            {!notification.read && (
                              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="min-w-0 flex-1 text-left"
                            title="Mark as read"
                          >
                            <p className="text-sm font-bold text-slate-900">
                              {notification.title}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-[11px] font-medium text-slate-400">
                              {notification.time}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeNotification(notification.id)
                            }
                            className="self-start rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label={`Remove ${notification.title}`}
                            title="Remove notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown footer */}
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-center text-[11px] text-slate-500">
                      DriveEase Vehicle Rental Management
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Header user profile */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {user?.fullName || "User"}
                </p>

                <p className="text-xs text-slate-500">{role}</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
