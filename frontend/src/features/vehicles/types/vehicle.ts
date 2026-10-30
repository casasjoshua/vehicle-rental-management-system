
export type VehicleStatus = "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE";

export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  model: string;
  plateNumber: string;
  vehicleType: string;
  year: number | null;
  seats: number;
  dailyRate: number | string;
  status: VehicleStatus;
  imageUrl: string | null;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleFormData {
  name: string;
  brand: string;
  model: string;
  plateNumber: string;
  vehicleType: string;
  year: number | null;
  seats: number;
  dailyRate: number;
  status: VehicleStatus;
  imageUrl: string;
  description: string;
}

export interface VehicleSearchValues {
  location: string;
  pickupDate: string;
  returnDate: string;
}

export interface VehicleFilters {
  search: string;
  vehicleType: string;
  status: string;
  minRate: string;
  maxRate: string;
}

export interface ApiMessage {
  success?: boolean;
  message?: string;
}
