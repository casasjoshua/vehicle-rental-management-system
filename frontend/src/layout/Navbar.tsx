import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CarFront, Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Home", to: "/" },
    { label: "Vehicles", to: "/vehicles" },
    { label: "How It Works", to: "/#how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <CarFront size={25} />
          </span>

          <span className="text-xl font-black tracking-tight text-slate-900">
            Drive<span className="text-blue-600">Easy.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-bold transition ${
                  isActive && link.to === "/"
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Log In
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 hover:bg-slate-100 md:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-100 bg-white p-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-blue-50"
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 font-semibold text-slate-700"
          >
            Log In
          </Link>

          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="block rounded-xl bg-blue-600 px-4 py-3 text-center font-bold text-white"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}