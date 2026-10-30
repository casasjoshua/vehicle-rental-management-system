
import { useState } from "react";
import { KeyRound, Eye, EyeOff, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

import { updateMyPassword } from "../../../services/profileService";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("Choose a password different from your current password.");
      return;
    }

    try {
      setLoading(true);

      const message = await updateMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update your password."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputType = showPasswords ? "text" : "password";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <KeyRound size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Change Password
          </h2>
          <p className="text-sm text-slate-500">
            Update your password to keep your account secure.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Current Password
          </label>

          <input
            id="currentPassword"
            type={inputType}
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            New Password
          </label>

          <input
            id="newPassword"
            type={inputType}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter new password"
          />
          <p className="mt-1 text-xs text-slate-500">
            Use at least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm New Password
          </label>

          <input
            id="confirmPassword"
            type={inputType}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Confirm new password"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(event) => setShowPasswords(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show passwords
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading && <LoaderCircle size={18} className="animate-spin" />}
          {loading ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </section>
  );
}
