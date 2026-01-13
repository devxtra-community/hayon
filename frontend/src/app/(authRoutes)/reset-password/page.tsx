"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPasswordSchema } from "@hayon/schemas";
import type { ZodError } from "zod";
import { useToast } from "@/context/ToastContext";

interface FormErrors {
  password?: string;
  token?: string;
  email?: string;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const router = useRouter();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    if (!token || !email) {
      setErrorMessage("Invalid reset link. Missing token or email.");
      return false;
    }

    if (password !== confirmPassword) {
      setFormErrors({ password: "Passwords do not match" });
      return false;
    }

    const result = resetPasswordSchema.safeParse({
      email,
      token,
      password,
    });

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
    setErrorMessage("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
      });

      showToast("success", "Password reset successfully", "Please login with your new password.");
      router.push("/login");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message ||
          "Failed to reset password. Please try again or request a new link.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-gray-300 shadow-xl w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center">Reset Password</CardTitle>
        <CardDescription className="text-center text-base">
          Enter your new password below
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`h-11 ${formErrors.password ? "border-red-500" : ""}`}
            />
            {formErrors.password ? (
              <p className="text-sm text-red-500">{formErrors.password}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <Button
            variant="black"
            type="submit"
            className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
