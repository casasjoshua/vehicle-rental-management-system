
import type {
  Booking,
  BookingStatusHistory,
  CreateBookingPayload,
} from "../features/booking/types/booking";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const BOOKINGS_URL = `${API_BASE_URL}/bookings`;
const BOOKING_HISTORY_URL = `${API_BASE_URL}/booking-status-history`;

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in to access your bookings.");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your backend."
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed (${response.status}).`
    );
  }

  return result as T;
}

function unwrapArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (result && typeof result === "object") {
    const response = result as {
      data?: unknown;
      bookings?: unknown;
    };

    if (Array.isArray(response.data)) {
      return response.data as T[];
    }

    if (Array.isArray(response.bookings)) {
      return response.bookings as T[];
    }

    // Supports { data: { bookings: [...] } }.
    if (
      response.data &&
      typeof response.data === "object" &&
      "bookings" in response.data
    ) {
      const bookings = (
        response.data as { bookings?: unknown }
      ).bookings;

      if (Array.isArray(bookings)) {
        return bookings as T[];
      }
    }
  }

  return [];
}

function unwrapObject<T>(result: unknown): T {
  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    const data = (result as { data: unknown }).data;

    if (data && typeof data === "object") {
      // Supports { data: { booking: {...} } }.
      if ("booking" in data) {
        return (data as { booking: T }).booking;
      }

      return data as T;
    }
  }

  return result as T;
}

/**
 * CUSTOMER
 * POST /api/bookings
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  const result = await request<unknown>(BOOKINGS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapObject<Booking>(result);
}

/**
 * CUSTOMER
 * GET /api/bookings/my-bookings
 */
export async function getMyBookings(): Promise<Booking[]> {
  const result = await request<unknown>(
    `${BOOKINGS_URL}/my-bookings`
  );

  return unwrapArray<Booking>(result);
}

/**
 * STAFF / ADMIN
 * GET /api/bookings
 */
export async function getAllBookings(): Promise<Booking[]> {
  const result = await request<unknown>(BOOKINGS_URL);

  return unwrapArray<Booking>(result);
}

/**
 * CUSTOMER / STAFF / ADMIN
 * GET /api/bookings/:id
 */
export async function getBookingById(
  id: number
): Promise<Booking> {
  const result = await request<unknown>(
    `${BOOKINGS_URL}/${id}`
  );

  return unwrapObject<Booking>(result);
}

/**
 * CUSTOMER
 * PATCH /api/bookings/:id/cancel
 */
export async function cancelBooking(
  id: number
): Promise<unknown> {
  return request<unknown>(
    `${BOOKINGS_URL}/${id}/cancel`,
    {
      method: "PATCH",
    }
  );
}

/**
 * STAFF / ADMIN
 * PATCH /api/bookings/:id/status
 *
 * The optional staffNote is sent only when provided.
 * Your backend must support saving staffNote for it to persist.
 */
export async function updateBookingStatus(
  id: number,
  status: Booking["status"],
  staffNote?: string
): Promise<Booking> {
  const body: {
    status: Booking["status"];
    staffNote?: string | null;
  } = { status };

  if (staffNote !== undefined) {
    body.staffNote = staffNote.trim() || null;
  }

  const result = await request<unknown>(
    `${BOOKINGS_URL}/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );

  return unwrapObject<Booking>(result);
}

/**
 * GET /api/booking-status-history/booking/:bookingId
 */
export async function getBookingStatusHistory(
  bookingId: number
): Promise<BookingStatusHistory[]> {
  const result = await request<unknown>(
    `${BOOKING_HISTORY_URL}/booking/${bookingId}`
  );

  return unwrapArray<BookingStatusHistory>(result);
}
