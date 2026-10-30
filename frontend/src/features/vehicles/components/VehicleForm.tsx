
import { useEffect, useState, type FormEvent } from "react";
import type {
  Vehicle,
  VehicleFormData,
  VehicleStatus,
} from "../types/vehicle";

const emptyForm: VehicleFormData = {
  name: "",
  brand: "",
  model: "",
  plateNumber: "",
  vehicleType: "SUV",
  year: null,
  seats: 5,
  dailyRate: 0,
  status: "AVAILABLE",
  imageUrl: "",
  description: "",
};

interface Props {
  vehicle?: Vehicle | null;
  saving: boolean;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function VehicleForm({
  vehicle,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<VehicleFormData>(emptyForm);

  useEffect(() => {
    if (vehicle) {
      setForm({
        name: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        year: vehicle.year,
        seats: vehicle.seats,
        dailyRate: Number(vehicle.dailyRate),
        status: vehicle.status,
        imageUrl: vehicle.imageUrl ?? "",
        description: vehicle.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [vehicle]);

  function update<K extends keyof VehicleFormData>(
    key: K,
    value: VehicleFormData[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      ...form,
      name: form.name.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      plateNumber: form.plateNumber.trim(),
      vehicleType: form.vehicleType.trim(),
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Vehicle name *
          <input
            required
            maxLength={150}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Toyota Fortuner"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Brand *
          <input
            required
            maxLength={100}
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="Toyota"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Model *
          <input
            required
            maxLength={100}
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
            placeholder="Fortuner 2.8"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Plate number *
          <input
            required
            maxLength={30}
            value={form.plateNumber}
            onChange={(e) => update("plateNumber", e.target.value)}
            placeholder="ABC-1234"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Vehicle type *
          <select
            required
            value={form.vehicleType}
            onChange={(e) => update("vehicleType", e.target.value)}
            className={inputClass}
          >
            <option value="SEDAN">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
            <option value="VAN">Van</option>
            <option value="PICKUP">Pickup</option>
            <option value="HATCHBACK">Hatchback</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Year
          <input
            type="number"
            min={1900}
            max={2100}
            value={form.year ?? ""}
            onChange={(e) =>
              update(
                "year",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            placeholder="2025"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Number of seats *
          <input
            type="number"
            min={1}
            step={1}
            required
            value={form.seats}
            onChange={(e) => update("seats", Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Daily rate (₱) *
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={form.dailyRate}
            onChange={(e) =>
              update("dailyRate", Number(e.target.value))
            }
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Image URL
          <input
            type="url"
            maxLength={500}
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="https://example.com/vehicle.jpg"
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-slate-400">
            Enter a publicly accessible image URL.
          </span>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Status
          <select
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value as VehicleStatus)
            }
            className={inputClass}
          >
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Description
          <textarea
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the vehicle and its features..."
            className={inputClass}
          />
        </label>
      </div>

      {form.imageUrl && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Image preview
          </p>
          <img
            src={form.imageUrl}
            alt="Vehicle preview"
            className="h-48 w-full rounded-xl border border-slate-200 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : vehicle
              ? "Save changes"
              : "Create vehicle"}
        </button>
      </div>
    </form>
  );
}
