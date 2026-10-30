
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import toast from "react-hot-toast";

import { loginUser } from "../../../services/authService";

export default function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        email: email.trim(),
        password,
      });

      toast.success(result.message || "Login successful.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Email address
        </label>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Password
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-slate-200 py-3.5 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" className="font-bold text-blue-600">
          Create account
        </Link>
      </p>
    </motion.form>
  );
}
