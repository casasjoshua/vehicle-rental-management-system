
export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: number | string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
  errors?: {
    field: string;
    message: string;
  }[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}
