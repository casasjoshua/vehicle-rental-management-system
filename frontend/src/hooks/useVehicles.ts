import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getVehicles } from "../services/vehicleService";
import type { Vehicle } from "../features/vehicles/types/vehicle";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getVehicles();
      setVehicles(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.";

      setError(message);
      toast.error("Could not load vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
  };
}