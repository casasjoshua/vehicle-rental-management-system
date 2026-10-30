
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}

export interface UpdateProfileData {
  fullName: string;
  email: string;
  phone: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const API_BASE_URL = "http://localhost:3000/api";
const PROFILE_URL = `${API_BASE_URL}/auth`;

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed (${response.status}).`
    );
  }

  return result as T;
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await request<
    ApiResponse<{ user: UserProfile }>
  >(`${PROFILE_URL}/me`);

  return response.data.user;
}

export async function updateMyProfile(
  data: UpdateProfileData
): Promise<UserProfile> {
  const response = await request<
    ApiResponse<{ user: UserProfile }>
  >(`${PROFILE_URL}/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return response.data.user;
}

export async function updateMyPassword(
  data: UpdatePasswordData
): Promise<string> {
  const response = await request<
    ApiResponse<unknown>
  >(`${PROFILE_URL}/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return response.message;
}