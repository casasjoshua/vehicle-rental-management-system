import { Link } from "react-router-dom";
import { ArrowLeft, CarFront } from "lucide-react";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
          <CarFront size={40} />
        </div>

        <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Road not found
        </h1>

        <p className="mt-4 leading-7 text-slate-500">
          This page doesn't exist or may have moved. Let's get you
          back to the homepage.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </section>
  );
}