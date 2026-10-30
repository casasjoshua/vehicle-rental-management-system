export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface BookingVehicle {
  id?: number;
  name?: string;
  brand?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  imageUrl?: string;
  image?: string;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  returnLocation: string;
  numberOfDays: number;
  dailyRate: string | number;
  totalAmount: string | number;
  status: BookingStatus;
  customerNote?: string | null;
  staffNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: BookingVehicle | null;
  vehicle?: BookingVehicle | null;
}

export interface BookingStatusHistory {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  changedBy?: number | null;
  note?: string | null;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface CreateBookingPayload {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  returnLocation: string;
  customerNote?: string;
}