"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "@/lib/axios";
import { AxiosError } from "axios";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      // Store access token in memory
      setAccessToken(data.accessToken);

      router.push("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || "Login failed. Please try again.");
      console.error("Login error", error);
    } finally {
      setIsLoading(false); // Add this to reset loading state
    }
  };

  const handleGoogleSignIn = () => {
    // Use environment variable instead of hardcoded URL
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    }/auth/google`;
  };

  return (
    <Card className="border-2 border-gray-300 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center text-base">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-12 text-base font-medium"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-[#318D62] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Dont have an account?{" "}
          <Link href="/register" className="text-[#318D62] font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
