import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { registerUser } from "../../../services/authService";
import type { RegisterData } from "../types/auth";

export default function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (fullName.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== confirmPassword) {
      toast.error("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        fullName,
        email,
        phone,
        password: form.password,
      });

      // Your API returns the token inside data.token.
      // Store it only if your app uses bearer-token authentication.
      if (result.data?.token) {
        localStorage.setItem("token", result.data.token);
      }

      if (result.data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(result.data.user)
        );
      }

      toast.success(result.message || "Registration successful!");

      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <UserRound size={28} />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Get started
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Create your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Join us to discover vehicles and make your next trip easier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full name */}
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Full name
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              className={inputClass}
              minLength={2}
              maxLength={100}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              maxLength={150}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Phone number
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <div className="relative">
            <Phone
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              maxLength={30}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              className={inputClass}
              minLength={8}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}