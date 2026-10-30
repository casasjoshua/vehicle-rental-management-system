
import { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import VehicleForm from "../features/vehicles/components/VehicleForm";
import VehicleStatusBadge from "../features/vehicles/components/VehicleStatusBadge";

import type {
  Vehicle,
  VehicleFormData,
  VehicleStatus,
} from "../features/vehicles/types/vehicle";

import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
  updateVehicleStatus,
} from "../services/vehicleService";

import { formatVehiclePrice } from "../utils/vehicleHelpers";

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  async function loadVehicles() {
    setLoading(true);

    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load vehicles."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch = [
        vehicle.name,
        vehicle.brand,
        vehicle.model,
        vehicle.plateNumber,
        vehicle.vehicleType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        !statusFilter || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  function openCreateModal() {
    setEditingVehicle(null);
    setModalOpen(true);
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setModalOpen(true);
  }

  async function handleSave(data: VehicleFormData) {
    setSaving(true);

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, data);
        toast.success("Vehicle updated successfully.");
      } else {
        await createVehicle(data);
        toast.success("Vehicle created successfully.");
      }

      setModalOpen(false);
      setEditingVehicle(null);
      await loadVehicles();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    vehicle: Vehicle,
    status: VehicleStatus
  ) {
    try {
      await updateVehicleStatus(vehicle.id, status);
      toast.success("Vehicle status updated.");
      await loadVehicles();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update vehicle status."
      );
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    const confirmed = window.confirm(
      `Delete "${vehicle.name}" (${vehicle.plateNumber})? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteVehicle(vehicle.id);
      setVehicles((current) =>
        current.filter((item) => item.id !== vehicle.id)
      );
      toast.success("Vehicle deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete vehicle."
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Fleet administration
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Vehicle Management
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create, update, and manage your rental fleet.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add vehicle
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total vehicles"
          value={vehicles.length}
          icon={<CarFront className="h-5 w-5" />}
        />
        <StatCard
          title="Available"
          value={vehicles.filter((v) => v.status === "AVAILABLE").length}
          icon={<CarFront className="h-5 w-5" />}
        />
        <StatCard
          title="Needs attention"
          value={
            vehicles.filter((v) => v.status !== "AVAILABLE").length
          }
          icon={<RefreshCw className="h-5 w-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicles..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            <button
              onClick={() => void loadVehicles()}
              disabled={loading}
              aria-label="Refresh vehicle list"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center">
            <CarFront className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-900">
              No vehicles found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Add a vehicle or change your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Vehicle</th>
                  <th className="px-5 py-4 font-bold">Plate number</th>
                  <th className="px-5 py-4 font-bold">Daily rate</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Change status</th>
                  <th className="px-5 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {vehicle.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt=""
                            className="h-12 w-16 rounded-lg bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <CarFront className="h-6 w-6" />
                          </div>
                        )}

                        <div>
                          <p className="font-bold text-slate-900">
                            {vehicle.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {vehicle.brand} {vehicle.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-600">
                      {vehicle.plateNumber}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatVehiclePrice(vehicle.dailyRate)}
                    </td>

                    <td className="px-5 py-4">
                      <VehicleStatusBadge status={vehicle.status} />
                    </td>

                    <td className="px-5 py-4">
                      <select
                        aria-label={`Change status for ${vehicle.name}`}
                        value={vehicle.status}
                        onChange={(e) =>
                          void handleStatusChange(
                            vehicle,
                            e.target.value as VehicleStatus
                          )
                        }
                        className="max-w-40 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="UNAVAILABLE">Unavailable</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          title="Edit vehicle"
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => void handleDelete(vehicle)}
                          title="Delete vehicle (admin only)"
                          className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingVehicle ? "Edit vehicle" : "Add new vehicle"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the vehicle details below.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <VehicleForm
                vehicle={editingVehicle}
                saving={saving}
                onSubmit={handleSave}
                onCancel={() => setModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
    </article>
  );
}
