"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MainLayout from "../components/MainLayout";
import { FormEvent, useState, useEffect } from "react";
import { User, Save, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const currentUser = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    id: "",
    phone: "",
    email: "",
  });

  // Prefill form when user data loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        id: currentUser.id || "",
        phone: currentUser.phone || "",
        email: currentUser.email || "",
      });
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Profile Settings</h1>
          <p className="text-slate-400 mt-1">
            Update your contact information for faster checkout
          </p>
        </div>

        {!isProfileComplete && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-yellow-200">
              ⚠️ Your profile is incomplete. Please fill in all fields to speed
              up checkout.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <User className="h-6 w-6 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Personal Information
              </h2>
              <p className="text-sm text-gray-600">
                This information will be prefilled at checkout
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Number *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+1234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if you need to update
                it.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-green-800 text-sm">
                  Profile updated successfully!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
