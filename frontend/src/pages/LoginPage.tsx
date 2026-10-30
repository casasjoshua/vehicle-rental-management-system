
import { Link } from "react-router-dom";
import { CarFront, ShieldCheck } from "lucide-react";

import LoginForm from "../features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
        <section className="p-6 sm:p-10 lg:p-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-black text-slate-900"
          >
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <CarFront className="h-6 w-6" />
            </span>
            DriveEase
          </Link>

          <h1 className="mt-10 text-3xl font-black text-slate-900">
            Welcome back
          </h1>

          <p className="mt-3 text-slate-500">
            Sign in to manage your vehicle rentals and bookings.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>

        <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 to-sky-500 p-10 text-white md:flex lg:p-12">
          <div>
            <span className="rounded-full border border-white/30 px-4 py-2 text-sm">
              Your journey starts here
            </span>

            <h2 className="mt-8 text-4xl font-black leading-tight">
              The right ride
              <br />
              for every journey.
            </h2>

            <p className="mt-5 leading-7 text-blue-50">
              Explore vehicles, organize bookings, and enjoy a simpler
              rental experience.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
            <ShieldCheck className="h-8 w-8" />
            <div>
              <p className="font-bold">Your account, your control</p>
              <p className="text-sm text-blue-50">
                Access your personalized dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
