
import type {
  RegisterData,
  RegisterResponse,
  AuthUser,
  LoginData,
  AuthResponse,
  MeResponse,
} from "../features/auth/types/auth";

const API_BASE_URL = "http://localhost:3000/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Register
export async function registerUser(
  data: RegisterData
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json().catch(() => null)) as
    | RegisterResponse
    | null;

  if (!response.ok || !result?.success) {
    const validationMessage = result?.errors
      ?.map((error) => `${error.field}: ${error.message}`)
      .join("\n");

    throw new Error(
      validationMessage ||
        result?.message ||
        `Registration failed (${response.status}).`
    );
  }

  return result;
}

// Session helpers
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser, token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Login
export async function loginUser(
  credentials: LoginData
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const result = (await response.json().catch(() => null)) as
    | AuthResponse
    | null;

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Login failed (${response.status}).`
    );
  }

  if (!result.data?.user || !result.data.token) {
    throw new Error("Incomplete login response from server.");
  }

  saveSession(result.data.user, result.data.token);

  return result;
}

// Current authenticated user
export async function getCurrentUser(): Promise<AuthUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = (await response.json().catch(() => null)) as
    | MeResponse
    | null;

  if (!response.ok || !result?.success) {
    clearSession();
    throw new Error("Your session has expired. Please log in again.");
  }

  localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));

  return result.data.user;
}

// Logout
export async function logoutUser(): Promise<void> {
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } finally {
    clearSession();
  }
}
