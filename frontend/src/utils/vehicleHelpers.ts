
import type { Vehicle } from "../features/vehicles/types/vehicle";

export function formatVehiclePrice(
  price: number | string
): string {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getVehicleImage(vehicle: Vehicle): string {
  return vehicle.imageUrl?.trim() || "";
}

export function filterVehicles(
  vehicles: Vehicle[],
  search: string,
  vehicleType: string,
  status: string,
  minRate: string,
  maxRate: string
): Vehicle[] {
  const normalizedSearch = search.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    const searchable = [
      vehicle.name,
      vehicle.brand,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.vehicleType,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchable.includes(normalizedSearch);

    const matchesType =
      !vehicleType || vehicle.vehicleType === vehicleType;

    const matchesStatus =
      !status || vehicle.status === status;

    const rate = Number(vehicle.dailyRate);

    const matchesMin =
      minRate === "" || rate >= Number(minRate);

    const matchesMax =
      maxRate === "" || rate <= Number(maxRate);

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesMin &&
      matchesMax
    );
  });
}
