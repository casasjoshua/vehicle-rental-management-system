import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  AlertCircle,
  Pencil,
  X,
  Save,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getUsers,
  updateUser,
  type User,
  type UserRole,
  type UserPagination,
} from "../services/userService";

const PAGE_SIZE = 10;

interface UsersPageProps {
  title?: string;
}

type AccountStatus = "true" | "false" | "";

interface EditUserForm {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  password: string;
}

const EMPTY_FORM: EditUserForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "CUSTOMER",
  isActive: true,
  password: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const passwordInputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function UsersPage({
  title = "Users Management",
}: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);

  const [pagination, setPagination] = useState<UserPagination>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Empty string means ALL roles.
  const [role, setRole] = useState<UserRole | "">("");
  const [isActive, setIsActive] = useState<AccountStatus>("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<EditUserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Debounce the search input.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Load users using the selected role, status, search, and page.
  const loadUsers = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await getUsers(
          {
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch,
            role, // "" means all roles
            isActive,
          },
          signal
        );

        if (signal.aborted) return;

        const result = response.data;
        const totalPages = result.pagination.totalPages;

        if (totalPages > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }

        if (totalPages === 0 && page !== 1) {
          setPage(1);
          return;
        }

        setUsers(result.users);
        setPagination(result.pagination);
      } catch (err) {
        if (signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Unable to load users."
        );

        setUsers([]);
        setPagination({
          total: 0,
          page: 1,
          limit: PAGE_SIZE,
          totalPages: 0,
        });
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, debouncedSearch, role, isActive, refreshKey]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadUsers(controller.signal);

    return () => controller.abort();
  }, [loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);

    setForm({
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: user.role,
      isActive: Boolean(user.isActive),
      password: "",
    });

    setShowPassword(false);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  };

  const handleFormChange = (
    field: keyof EditUserForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdateUser = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingUser) return;

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password;

    if (fullName.length < 2) {
      toast.error("Full name must contain at least 2 characters.");
      return;
    }

    if (!email) {
      toast.error("Email address is required.");
      return;
    }

    if (password && password.length < 8) {
      toast.error("The new password must be at least 8 characters.");
      return;
    }

    if (password.length > 72) {
      toast.error("The new password must not exceed 72 characters.");
      return;
    }

    setSaving(true);

    try {
      await updateUser(editingUser.id, {
        fullName,
        email,
        phone,
        role: form.role,
        isActive: form.isActive,
        ...(password ? { password } : {}),
      });

      toast.success("User updated successfully.");

      setEditingUser(null);
      setForm(EMPTY_FORM);
      setShowPassword(false);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to update this user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRole(value as UserRole | "");
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setIsActive(value as AccountStatus);
    setPage(1);
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const roleStyle = (userRole: UserRole) => {
    switch (userRole) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "STAFF":
        return "bg-blue-100 text-blue-700";
      case "CUSTOMER":
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const firstItem =
    pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(page * PAGE_SIZE, pagination.total);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Users size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage administrators, staff, and customers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total matching users
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {pagination.total.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Based on your current filters
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-blue-700">
              <UserRound size={28} />
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label
                htmlFor="user-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search users
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="user-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(event.target.value)
                  }
                  placeholder="Search name, email, or phone..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Enabled role filter */}
            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Filter by role
              </label>

              <select
                id="user-role"
                value={role}
                onChange={(event) =>
                  handleRoleChange(event.target.value)
                }
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="user-status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Account status
              </label>

              <select
                id="user-status"
                value={isActive}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">User Directory</h2>

              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading..."
                  : `${users.length} user${users.length === 1 ? "" : "s"} on this page`}
              </p>
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">Unable to load users</p>
                <p className="mt-1">{error}</p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-3 inline-flex items-center gap-2 font-semibold underline"
                >
                  <RefreshCw size={14} />
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">User ID</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="px-5 py-5">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Users
                        size={36}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 font-semibold text-slate-700">
                        No users found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {getInitials(user.fullName)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.fullName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Account #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Mail
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            {user.email}
                          </p>

                          <p className="flex items-center gap-2">
                            <Phone
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            {user.phone || "No phone number"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${roleStyle(user.role)}`}
                        >
                          {user.role === "ADMIN" && (
                            <ShieldCheck size={13} />
                          )}
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              user.isActive
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-500">
                        #{user.id}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                          aria-label={`Edit ${user.fullName}`}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {pagination.total === 0
                ? "No users to display"
                : `Showing ${firstItem}–${lastItem} of ${pagination.total} users`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
                {page} / {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                disabled={
                  loading ||
                  pagination.totalPages === 0 ||
                  page >= pagination.totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Pencil size={21} />
                </div>

                <div>
                  <h2
                    id="edit-user-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Edit User
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update account details and permissions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close edit user modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Editing account
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {editingUser.fullName}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    User ID: #{editingUser.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="edit-full-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="edit-full-name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={150}
                      value={form.fullName}
                      onChange={(event) =>
                        handleFormChange("fullName", event.target.value)
                      }
                      placeholder="Enter full name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email address <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="edit-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={150}
                      value={form.email}
                      onChange={(event) =>
                        handleFormChange("email", event.target.value)
                      }
                      placeholder="user@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone number
                    </label>

                    <input
                      id="edit-phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={form.phone}
                      onChange={(event) =>
                        handleFormChange("phone", event.target.value)
                      }
                      placeholder="Enter phone number"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-role"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      User role
                    </label>

                    <select
                      id="edit-role"
                      value={form.role}
                      onChange={(event) =>
                        handleFormChange(
                          "role",
                          event.target.value as UserRole
                        )
                      }
                      className={inputClass}
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-status"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Account status
                    </label>

                    <select
                      id="edit-status"
                      value={form.isActive ? "true" : "false"}
                      onChange={(event) =>
                        handleFormChange(
                          "isActive",
                          event.target.value === "true"
                        )
                      }
                      className={inputClass}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="edit-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      New password
                      <span className="ml-2 font-normal text-slate-400">
                        (optional)
                      </span>
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={72}
                        value={form.password}
                        onChange={(event) =>
                          handleFormChange("password", event.target.value)
                        }
                        placeholder="Leave blank to keep current password"
                        className={passwordInputClass}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Enter a password only if you want to change it.
                      Minimum 8 characters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
