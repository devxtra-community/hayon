"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "@/lib/axios";
import { AxiosError } from "axios";
import { loginSchema } from "@hayon/schemas";
import type { ZodError } from "zod";
import { useToast } from "@/context/ToastContext";

import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";

interface LoginFormProps {
  isAdmin?: boolean;
  loginEndpoint?: string;
  redirectPath?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginForm({
  isAdmin = false,
  loginEndpoint = "/auth/login",
  redirectPath = "/dashboard",
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        email_exists_different_provider:
          "This email is already registered with email/password. Please login with your password instead.",
        no_email: "Unable to get email from Google account. Please try again.",
        google_auth_failed: "Google authentication failed. Please try again.",
        session_expired: "Your session has expired. Please login again.",
      };

      const message = errorMessages[error] || "An error occurred. Please try again.";

      showToast("error", "Login failed", message);
      window.history.replaceState({}, "", isAdmin ? "/admin-login" : "/admin/login");
    }
  }, [error, isAdmin]);

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors: FormErrors = {};
      const zodErrors = result.error as ZodError;

      zodErrors.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });

      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Login request");
      const { data } = await api.post(loginEndpoint, { email, password });

      // Store access token in memory
      setAccessToken(data.data.accessToken);

      async function setupPush(userId: string) {
        console.log("Setting up push");
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.log("Permission denied");
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        });
        console.log("FCM Token:", token);

        await api.post("/firebase/save-token", { userId, token });
      }

      await setupPush(data.data.user.id);
      return router.push(redirectPath);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast(
        "error",
        "Login failed",
        axiosError.response?.data?.message || "Login failed. Please try again.",
      );
      console.error("Login error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "https://api.hayon.site/api"}/auth/google`;
  };

  const handleForgotPassword = () => {
    if (!email) {
      showToast(
        "error",
        "Failed to send reset email",
        "Please enter your email address to reset your password.",
      );
      return;
    }
    api
      .post("/auth/send-reset-email", { email })
      .then(() => {
        showToast("success", "Password reset email sent", "Please check your inbox.");
      })
      .catch(() => {
        showToast("error", "Failed to send reset email", "Please try again.");
      });
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-500 dark:text-zinc-400 font-medium ml-4">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`h-14 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-6 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.email ? "border-red-500" : ""}`}
          />
          {formErrors.email && <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              title="Password"
              className="text-zinc-500 dark:text-zinc-400 font-medium ml-4"
            >
              Password
            </Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`h-14 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-6 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.password ? "border-red-500" : ""}`}
            />
            {/* Password toggle icon could go here to match reference */}
          </div>
          {formErrors.password && (
            <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.password}</p>
          )}
          <div className="flex justify-end pr-4">
            {!isAdmin && (
              <span
                onClick={handleForgotPassword}
                className="text-xs text-zinc-900 dark:text-zinc-100 cursor-pointer font-bold hover:underline transition-all"
              >
                Forgot Password?
              </span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-14 rounded-full text-lg font-bold bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg mt-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
              <span>Login...</span>
            </div>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      {!isAdmin && (
        <div className="space-y-6 pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-950 px-4 text-zinc-400 font-medium tracking-wider">
                or continue with
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full h-14 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                Continue with Google
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
