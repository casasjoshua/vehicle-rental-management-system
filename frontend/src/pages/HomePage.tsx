
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CarFront,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import VehicleCard from "../features/vehicles/components/VehicleCard";
import VehicleSearch from "../features/vehicles/components/VehicleSearch";
import { useVehicles } from "../hooks/useVehicles";
import type { VehicleSearchValues } from "../features/vehicles/types/vehicle";
import Loading from "../components/ui/Loading";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function HomePage() {
  const { vehicles, loading, error, refetch } = useVehicles();

  const [search, setSearch] = useState<VehicleSearchValues | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) => vehicle.status === "AVAILABLE"
    );
  }, [vehicles]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700">
              <Sparkles size={16} />
              Your next journey starts here
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              The road is yours.
              <span className="mt-2 block text-blue-600">
                Drive your way.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Discover your perfect ride for everyday drives, family trips,
              and unforgettable adventures.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#vehicles"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Explore Vehicles
                <ArrowRight size={19} />
              </a>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                How It Works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-5 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-blue-600" />
                Simple booking
              </span>

              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                Clear pricing
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65 }}
            className="relative"
          >
            <div className="absolute -inset-5 -z-10 rounded-full bg-blue-200/60 blur-3xl" />

            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85"
              alt="Car ready for a road trip"
              fetchPriority="high"
              className="h-[320px] w-full rounded-[2rem] object-cover shadow-2xl sm:h-[430px]"
            />

            <div className="absolute -bottom-5 left-5 right-5 flex items-center gap-4 rounded-2xl border border-white bg-white/95 p-5 shadow-xl backdrop-blur sm:left-8 sm:right-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CarFront size={26} />
              </span>

              <div>
                <p className="font-extrabold text-slate-900">
                  Find your perfect ride
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Your journey begins here.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 lg:px-8">
        <VehicleSearch onSearch={setSearch} />
      </section>

      {/* Vehicle listing */}
      <section id="vehicles" className="scroll-mt-24 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                Our Fleet
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Find your perfect ride
              </h2>

              <p className="mt-3 max-w-xl leading-7 text-slate-500">
                Browse our available vehicles and compare their features.
              </p>
            </div>

            {!loading && !error && (
              <span className="text-sm font-semibold text-slate-500">
                {filteredVehicles.length} available vehicle(s)
              </span>
            )}
          </div>

          {loading ? (
            <Loading message="Loading vehicles from your API..." />
          ) : error ? (
            <ErrorMessage
              message={error}
              onRetry={() => void refetch()}
            />
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-16 text-center">
              <CarFront
                className="mx-auto text-slate-400"
                size={42}
              />

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                No available vehicles
              </h3>

              <p className="mt-2 text-slate-500">
                Please check back later for available vehicles.
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(null)}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {search && (
                <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-bold">Your search details</p>

                  <p className="mt-1">
                    Location: {search.location}
                  </p>

                  <p className="mt-1">
                    Pickup: {search.pickupDate}
                  </p>

                  <p className="mt-1">
                    Return: {search.returnDate}
                  </p>

                  <p className="mt-2 text-blue-700">
                    These dates are displayed for reference. Live booking
                    availability has not yet been checked.
                  </p>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
              Why DriveEasy
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Renting a car, made simple
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              Discover a straightforward way to compare vehicles and plan
              your next journey.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: CalendarCheck,
                title: "Easy planning",
                description:
                  "Enter your preferred location and rental dates in one place.",
              },
              {
                icon: ShieldCheck,
                title: "Clear pricing",
                description:
                  "Compare the listed daily rates before starting your booking.",
              },
              {
                icon: BadgeCheck,
                title: "More choices",
                description:
                  "Review vehicle categories, seats, and other available details.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-500">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-20"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
              Getting Started
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Three steps to your next adventure
            </h2>

            <div className="mt-9 space-y-7">
              {[
                [
                  "01",
                  "Choose your vehicle",
                  "Compare the vehicles in our fleet.",
                ],
                [
                  "02",
                  "Select your dates",
                  "Enter your preferred pickup and return dates.",
                ],
                [
                  "03",
                  "Continue to booking",
                  "Review your choice and proceed when booking is available.",
                ],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-white">
                    {number}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      {title}
                    </h3>

                    <p className="mt-1 leading-7 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/register"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>

          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85"
            alt="Vehicle ready for a journey"
            loading="lazy"
            className="h-[340px] w-full rounded-[2rem] object-cover shadow-xl sm:h-[460px]"
          />
        </div>
      </section>
    </>
  );
}
