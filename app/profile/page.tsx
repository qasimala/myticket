"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MainLayout from "../components/MainLayout";
import { FormEvent, useState, useEffect } from "react";
import { User, Save, CheckCircle2, LogOut, Edit2, X } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const currentUser = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [originalFormData, setOriginalFormData] = useState({
    name: "",
    id: "",
    phone: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    id: "",
    phone: "",
    email: "",
  });

  // Prefill form when user data loads
  useEffect(() => {
    if (currentUser) {
      const initialData = {
        name: currentUser.name || "",
        id: currentUser.id || "",
        phone: currentUser.phone || "",
        email: currentUser.email || "",
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    }
  }, [currentUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      await updateProfile({
        name: formData.name || undefined,
        id: formData.id || undefined,
        phone: formData.phone || undefined,
      });
      setOriginalFormData(formData);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalFormData);
    setIsEditing(false);
    setError("");
    setSaveSuccess(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSaveSuccess(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
      setIsSigningOut(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-slate-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="animate-fade-up rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            🔒
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Sign In Required</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please sign in to view your profile
          </p>
        </div>
      </MainLayout>
    );
  }

  const isProfileComplete =
    formData.name && formData.id && formData.phone && formData.email;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Profile Settings</h1>
          <p className="mt-1 text-slate-400">
            Update your contact information for faster checkout
          </p>
        </div>

        {!isProfileComplete && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-4 backdrop-blur-xl animate-fade-up">
            <p className="text-sm text-yellow-200">
              ⚠️ Your profile is incomplete. Please fill in all fields to speed
              up checkout.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg backdrop-blur-xl transition hover:border-white/20 hover:shadow-xl animate-fade-up">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <User className="h-6 w-6 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-50">
                Personal Information
              </h2>
              <p className="text-sm text-slate-400">
                This information will be prefilled at checkout
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20"
              >
                <Edit2 className="h-4 w-4" strokeWidth={2} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:text-slate-400"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                ID Number *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                disabled={!isEditing}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:text-slate-400"
                placeholder="1234567890"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!isEditing}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:text-slate-400"
                placeholder="+1234567890"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed. Contact support if you need to update
                it.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-xl animate-fade-up">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/20 p-4 backdrop-blur-xl animate-fade-up">
                <CheckCircle2 className="h-5 w-5 text-green-200" />
                <p className="text-sm text-green-200">
                  Profile updated successfully!
                </p>
              </div>
            )}

            {isEditing && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" strokeWidth={2} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Sign Out Section */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 shadow-lg backdrop-blur-xl transition hover:border-red-500/30 animate-fade-up">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <LogOut className="h-6 w-6 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50">
                Account Actions
              </h2>
              <p className="text-sm text-slate-400">
                Sign out of your account
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-500/30 hover:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-200"></div>
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" strokeWidth={2} />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
