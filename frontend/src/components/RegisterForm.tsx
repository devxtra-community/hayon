"use client";
import { api, setAccessToken } from "@/lib/axios";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Mail, ArrowRight, Upload, User } from "lucide-react";
import { motion } from "framer-motion";
import { requestOtpSchema, verifyOtpSchema, signupSchema } from "@hayon/schemas";
import type { ZodError } from "zod";
import { useToast } from "@/context/ToastContext";

type Step = "email" | "otp" | "details";

interface FormErrors {
  email?: string;
  otp?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { showToast } = useToast();

  const progress = step === "email" ? 33 : step === "otp" ? 66 : 100;

  // Timer effect for OTP resend cooldown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleGoogleSignUp = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "https://api.hayon.site/api"}/auth/google`;
  };

  const validateEmailStep = (): boolean => {
    const result = requestOtpSchema.safeParse({ email });
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

  const validateOtpStep = (): boolean => {
    const result = verifyOtpSchema.safeParse({ email, otp });
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

  const validateDetailsStep = (): boolean => {
    const result = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
      name,
      avatar: avatar || undefined,
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
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailStep()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/request-otp", { email });
      setStep("otp");
      setResendTimer(15);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast(
        "error",
        "Failed to send OTP",
        axiosError.response?.data?.message || "Error message here",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOtpStep()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/verify-otp", { email, otp });

      setStep("details");
      setFormErrors({});
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast("error", "Failed to verify OTP", axiosError.response?.data?.message || "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);

    try {
      await api.post("/auth/request-otp", { email });

      setResendTimer(15);
      showToast("success", "OTP sent successfully", "Please check your inbox.");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast("error", "Failed to send OTP", axiosError.response?.data?.message || "");
    } finally {
      setIsResending(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validates password match via refine()
    if (!validateDetailsStep()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/signup", {
        email,
        name,
        password,
        confirmPassword,
        avatar,
      });

      // Store access token in memory
      setAccessToken(data.accessToken);

      showToast("success", "Registration successful!", "You have been successfully registered.");
      window.location.href = "/dashboard";
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast(
        "error",
        "Registration failed",
        axiosError.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Step Indicator */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <span>Step {step === "email" ? "1" : step === "otp" ? "2" : "3"} of 3</span>
          <span>{progress}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald-600"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* STEP 1: Email / Google OAuth */}
        {step === "email" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-zinc-500 dark:text-zinc-400 font-medium ml-4"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`h-14 rounded-full pl-14 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.email}</p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full h-14 rounded-full text-lg font-bold bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-bold justify-center">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="border-zinc-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#f3f4f6] dark:bg-zinc-950 px-4 text-zinc-400 font-medium tracking-wider">
                  or continue with
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleGoogleSignUp}
                type="button"
                className="w-full h-14 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm bg-white"
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
          </motion.div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-500 dark:text-zinc-400 font-medium ml-4">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className={`h-14 rounded-full text-center text-2xl tracking-[0.5em] font-bold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.otp ? "border-red-500" : ""}`}
                />
                {formErrors.otp && (
                  <p className="text-xs text-red-500 text-center mt-1 ml-4">{formErrors.otp}</p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  className={`text-sm font-medium transition-colors ${
                    resendTimer > 0 || isResending
                      ? "text-zinc-400 cursor-not-allowed"
                      : "text-emerald-600 hover:text-emerald-500"
                  }`}
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isResending}
                >
                  {isResending
                    ? "Resending..."
                    : resendTimer > 0
                      ? `Resend code in ${resendTimer}s`
                      : "Resend verification code"}
                </button>
              </div>
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full h-14 rounded-full text-lg font-bold bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <button
              type="button"
              className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </motion.div>
        )}

        {/* STEP 3: User Details */}
        {step === "details" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-white dark:border-zinc-900 shadow-xl">
                  <AvatarImage src={avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30">
                    <User className="w-12 h-12 text-emerald-600" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-emerald-500 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-sm font-medium text-zinc-500">Upload profile photo</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-500 dark:text-zinc-400 font-medium ml-4">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`h-14 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-6 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.name ? "border-red-500" : ""}`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  title="Password"
                  className="text-zinc-500 dark:text-zinc-400 font-medium ml-4"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`h-14 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-6 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.password ? "border-red-500" : ""}`}
                  minLength={8}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  title="Confirm Password"
                  className="text-zinc-500 dark:text-zinc-400 font-medium ml-4"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`h-14 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-6 focus:ring-zinc-900 focus:border-zinc-900 ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleCompleteRegistration}
              className="w-full h-14 rounded-full text-lg font-bold bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
