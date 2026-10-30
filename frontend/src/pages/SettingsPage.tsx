
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  LoaderCircle,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  type UserProfile,
} from "../services/profileService";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  async function loadProfile() {
    setLoading(true);

    try {
      const user = await getMyProfile();

      setProfile(user);
      setForm({
        fullName: user.fullName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePasswordChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (form.fullName.trim().length < 2) {
      toast.error("Full name must contain at least 2 characters.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await updateMyProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });

      setProfile(updatedUser);

      setForm({
        fullName: updatedUser.fullName ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
      });

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              ...updatedUser,
            })
          );
        } catch {
          // Profile update succeeded; cached user data was not updated.
        }
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword.length > 72) {
      toast.error("New password must not exceed 72 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("Your new password must differ from your current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const message = await updateMyPassword(passwordForm);

      toast.success(message || "Password updated successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-sm text-slate-500">
          Loading your account...
        </span>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const passwordInputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Account management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your personal information, account details, and password.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Profile summary */}
          <div className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-24 bg-gradient-to-r from-blue-700 to-blue-500" />

            <div className="-mt-12 px-6 pb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 text-blue-700 shadow-sm">
                <UserRound className="h-11 w-11" />
              </div>

              <h2 className="mt-4 break-words text-xl font-bold text-slate-900">
                {profile?.fullName}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {profile?.email}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                {profile?.role}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Account ID
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  #{profile?.id}
                </p>
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="space-y-6 lg:col-span-2">
            {/* Edit profile form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Personal information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the details associated with your account.
                  </p>
                </div>

                <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
                  <UserRound className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-5">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={150}
                      required
                      className={inputClass}
                      placeholder="Enter your full name"
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
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      maxLength={150}
                      required
                      className={inputClass}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Your email must not already belong to another account.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone number{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={30}
                      className={inputClass}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Profile actions */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  disabled={saving || changingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Change password form */}
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Change password
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Verify your current password before setting a new one.
                  </p>
                </div>

                <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
                  <KeyRound className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-5">
                {/* Current password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Current password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPasswords ? "text" : "password"}
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className={passwordInputClass}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPasswords ? "text" : "password"}
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      minLength={8}
                      maxLength={72}
                      required
                      className={inputClass}
                      placeholder="Enter your new password"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className={inputClass}
                      placeholder="Re-enter your new password"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={(event) =>
                      setShowPasswords(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Show passwords
                </label>
              </div>

              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {changingPassword ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Update password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
