
import type {
  ApiMessage,
  Vehicle,
  VehicleFormData,
  VehicleStatus,
} from "../features/vehicles/types/vehicle";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const VEHICLES_URL = `${API_BASE_URL}/vehicles`;

/**
 * Get the authentication token from localStorage.
 */
function getToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Reusable API request function.
 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result as T;
}

/**
 * Extract a vehicle array from supported API response formats.
 *
 * Supported:
 * - [...]
 * - { data: [...] }
 * - { vehicles: [...] }
 * - { data: { vehicles: [...] } }
 */
function unwrapVehicleList(result: unknown): Vehicle[] {
  if (Array.isArray(result)) {
    return result as Vehicle[];
  }

  if (!result || typeof result !== "object") {
    throw new Error(
      "Unexpected API response. Expected a list of vehicles."
    );
  }

  const object = result as Record<string, unknown>;
  const data = object.data;

  if (Array.isArray(data)) {
    return data as Vehicle[];
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;

    if (Array.isArray(nested.vehicles)) {
      return nested.vehicles as Vehicle[];
    }
  }

  if (Array.isArray(object.vehicles)) {
    return object.vehicles as Vehicle[];
  }

  throw new Error(
    "Unexpected API response. Expected a list of vehicles."
  );
}

/**
 * Extract a single vehicle from supported API response formats.
 *
 * Supported:
 * - { data: { id: 1, ... } }
 * - { data: { vehicle: { id: 1, ... } } }
 * - { vehicle: { id: 1, ... } }
 * - { id: 1, ... }
 */
function unwrapVehicle(result: unknown): Vehicle {
  if (!result || typeof result !== "object") {
    throw new Error("Unexpected API response for vehicle.");
  }

  const object = result as Record<string, unknown>;
  const data = object.data;

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;

    if (
      nested.vehicle &&
      typeof nested.vehicle === "object"
    ) {
      return nested.vehicle as Vehicle;
    }

    if ("id" in nested) {
      return nested as unknown as Vehicle;
    }
  }

  if (
    object.vehicle &&
    typeof object.vehicle === "object"
  ) {
    return object.vehicle as Vehicle;
  }

  if ("id" in object) {
    return object as unknown as Vehicle;
  }

  throw new Error("Vehicle was not found in the API response.");
}

/**
 * Get all vehicles.
 * GET /api/vehicles
 */
export async function getVehicles(): Promise<Vehicle[]> {
  const result = await request<unknown>(VEHICLES_URL);

  return unwrapVehicleList(result);
}

/**
 * Get available vehicles.
 *
 * Without dates:
 * GET /api/vehicles/available
 *
 * With dates:
 * GET /api/vehicles/available?startDate=2026-10-30&endDate=2026-11-02
 *
 * The backend must implement date-based availability filtering
 * for these parameters to affect the results.
 */
export async function getAvailableVehicles(
  startDate?: string,
  endDate?: string
): Promise<Vehicle[]> {
  if ((startDate && !endDate) || (!startDate && endDate)) {
    throw new Error(
      "Both pickup and return dates are required."
    );
  }

  if (startDate && endDate) {
    if (endDate < startDate) {
      throw new Error(
        "Return date must be on or after the pickup date."
      );
    }
  }

  const params = new URLSearchParams();

  if (startDate && endDate) {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  const query = params.toString();

  const url = query
    ? `${VEHICLES_URL}/available?${query}`
    : `${VEHICLES_URL}/available`;

  const result = await request<unknown>(url);

  return unwrapVehicleList(result);
}

/**
 * Get one vehicle by ID.
 * GET /api/vehicles/:id
 */
export async function getVehicleById(
  id: number | string
): Promise<Vehicle> {
  const result = await request<unknown>(
    `${VEHICLES_URL}/${encodeURIComponent(String(id))}`
  );

  return unwrapVehicle(result);
}

/**
 * Create a vehicle.
 * POST /api/vehicles
 */
export async function createVehicle(
  data: VehicleFormData
): Promise<Vehicle> {
  const result = await request<unknown>(VEHICLES_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return unwrapVehicle(result);
}

/**
 * Update a vehicle.
 * PUT /api/vehicles/:id
 */
export async function updateVehicle(
  id: number | string,
  data: VehicleFormData
): Promise<Vehicle> {
  const result = await request<unknown>(
    `${VEHICLES_URL}/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  return unwrapVehicle(result);
}

/**
 * Update vehicle status.
 * PATCH /api/vehicles/:id/status
 */
export async function updateVehicleStatus(
  id: number | string,
  status: VehicleStatus
): Promise<ApiMessage> {
  return request<ApiMessage>(
    `${VEHICLES_URL}/${encodeURIComponent(String(id))}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

/**
 * Delete a vehicle.
 * DELETE /api/vehicles/:id
 */
export async function deleteVehicle(
  id: number | string
): Promise<ApiMessage> {
  return request<ApiMessage>(
    `${VEHICLES_URL}/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
}
