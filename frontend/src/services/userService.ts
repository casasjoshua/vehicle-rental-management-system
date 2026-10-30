
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "";
  isActive?: "true" | "false" | "";
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface GetUsersData {
  users: User[];
  pagination: UserPagination;
}

interface GetUsersResponse {
  success: boolean;
  message: string;
  data: GetUsersData;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    if (options.signal?.aborted) {
      throw new DOMException("Request aborted.", "AbortError");
    }

    throw new Error(
      "Unable to connect to the server. Check that your backend is running."
    );
  }

  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    if (options.signal?.aborted) {
      throw new DOMException("Request aborted.", "AbortError");
    }

    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || !result.success) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to manage users.");
    }

    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

// GET /api/admin/users
export async function getUsers(
  params: GetUsersParams = {},
  signal?: AbortSignal
): Promise<GetUsersResponse> {
  const query = new URLSearchParams();

  query.set(
    "page",
    String(Math.max(1, Math.floor(params.page ?? 1)))
  );

  query.set(
    "limit",
    String(Math.min(100, Math.max(1, Math.floor(params.limit ?? 10))))
  );

  const search = params.search?.trim();

  if (search) {
    query.set("search", search);
  }

  if (params.role !== undefined && params.role !== "") {
    query.set("role", params.role);
  }

  if (params.isActive !== undefined && params.isActive !== "") {
    query.set("isActive", params.isActive);
  }

  const result = await apiRequest<GetUsersData>(
    `/admin/users?${query.toString()}`,
    {
      method: "GET",
      signal,
    }
  );

  if (
    !result.data ||
    !Array.isArray(result.data.users) ||
    !result.data.pagination
  ) {
    throw new Error("The server did not return a valid users list.");
  }

  return {
    success: result.success,
    message: result.message,
    data: {
      users: result.data.users,
      pagination: result.data.pagination,
    },
  };
}

// POST /api/admin/users
export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<User> {
  const result = await apiRequest<{ user: User }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.data?.user) {
    throw new Error("The server did not return the created user.");
  }

  return result.data.user;
}

// PATCH /api/admin/users/:id
export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<User> {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("Invalid user ID.");
  }

  const result = await apiRequest<{ user: User }>(
    `/admin/users/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  if (!result.data?.user) {
    throw new Error("The server did not return the updated user.");
  }

  return result.data.user;
}
