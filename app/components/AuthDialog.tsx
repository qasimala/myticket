"use client";

import { useState, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { X, Sparkles, Loader2 } from "lucide-react";

interface AuthDialogProps {
  onClose: () => void;
}

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const { signIn } = useAuthActions();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("flow", isSignUp ? "signUp" : "signIn");

      if (isSignUp && formData.name) {
        formDataToSend.append("name", formData.name);
      }

      await signIn("password", formDataToSend);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_28px_70px_rgba(15,23,42,0.55)] backdrop-blur-xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70" />

        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Sparkles className="h-5 w-5 text-white" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isSignUp
                    ? "Join us to start curating moments"
                    : "Sign in to continue"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-slate-200"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/20 p-4 animate-fade-up">
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-up">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="animate-fade-up animation-delay-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="animate-fade-up animation-delay-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              {isSignUp && (
                <p className="mt-2 text-xs text-slate-400">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.32)] disabled:cursor-not-allowed disabled:opacity-50 animate-fade-up animation-delay-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  <span>Processing...</span>
                </span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Toggle sign up/sign in */}
          <div className="mt-6 text-center animate-fade-up animation-delay-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-sm font-medium text-slate-300 transition hover:text-indigo-300"
            >
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span className="text-indigo-400">Sign in</span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="text-indigo-400">Sign up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
