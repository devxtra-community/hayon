"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo_IMG from "@/assets/logo.png";
import dashboardImg from "@/assets/Dashboard.png";
import { BookOpen, Sparkles, Menu, X, Calendar, BarChart3, FileText } from "lucide-react";
import Link from "next/link";
import { CardImage } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { api, setAccessToken, getAccessToken } from '@/lib/axios';
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        try {
          const { data } = await api.post('/auth/refresh');
          setAccessToken(data.data.accessToken);
        } catch {
          setIsChecking(false);
          return;
        }
      }

      // User has valid token - check their role
      try {
        const { data } = await api.get('/auth/me');
        const user: User = data.data.user;

        if (user.role === 'user') {
          router.push('/dashboard');
          return;
        } else if (user.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }
      } catch {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-0 gradient flex flex-col items-center justify-between pt-6 pb-12 px-6">
            {/* Close Button */}
            <div className="w-full flex justify-start">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-200"
              >
                <X size={24} className="text-gray-800" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <Link href="#" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"outline"} className="w-full py-6 text-lg">What is Hayon</Button>
              </Link>
              <Link href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"outline"} className="w-full py-6 text-lg">Login</Button>
              </Link>
              <Link href="/pricing" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"outline"} className="w-full py-6 text-lg">Pricing</Button>
              </Link>
            </div>

            {/* CTA Button */}
            <div className="w-full max-w-xs">
              <Link href="/register" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"black"} className="w-full py-6 text-lg">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="p-4 md:p-8 min-h-screen bg-background">
        <div className="gradient min-h-[90vh] md:min-h-screen rounded-xl md:rounded-2xl relative overflow-hidden">
          {/* Navigation BAR */}
          <nav className="flex items-center justify-between px-4 md:px-8 py-4 md:py-8">
            <div className="flex-shrink-0">
              <Image src={logo_IMG} alt="Hayon logo" className="w-7 h-7 md:w-10 md:h-10" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-3 lg:gap-4">
              <Button variant={"outline"}>What is hayon</Button>
              <Link href="/pricing">
                <Button variant={"outline"}>Pricing</Button>
              </Link>
              <Link href="/login">
                <Button variant={"outline"}>Login</Button>
              </Link>
            </div>

            <div className="hidden md:block">
              <Link href="/register">
                <Button variant={"black"}>Start Free Trial</Button>
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Menu size={24} className="text-white" />
            </button>
          </nav>

          {/* Hero */}
          <main className="px-4 md:px-8">
            <div className="flex justify-center items-center gap-6 md:gap-10 lg:gap-14 flex-col mt-8 md:mt-16 lg:mt-20">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl w-full md:w-3/4 lg:w-1/2 text-center font-semibold text-white leading-tight">
                Automate Your Social Media with AI
              </h1>

              <Link href="/register">
                <button className="px-4 py-2 md:py-3 bg-background rounded-full text-base md:text-lg flex items-center gap-5 hover:scale-105 transition-transform">
                  Sign Up
                  <span className="bg-foreground px-2 md:px-5 py-1 md:py-1 rounded-full text-sm md:text-md text-background">
                    Now
                  </span>
                </button>
              </Link>
            </div>

            {/* Dashboard Image */}
            <div className="w-full mt-10 md:mt-16 lg:mt-20 px-2 md:px-8 pb-0">
              <div className="bg-black rounded-t-xl md:rounded-t-2xl p-3 md:p-6 lg:p-8 overflow-hidden">
                <div className="rounded-t-lg md:rounded-t-xl overflow-hidden">
                  <Image
                    src={dashboardImg}
                    alt="Hayon Dashboard Preview"
                    className="w-full h-auto object-cover object-top"
                    priority
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* How Hayon Works Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="flex items-center flex-col gap-3 md:gap-4 justify-center">
          <Button variant={"icon_outline"} className="text-sm md:text-base">
            <BookOpen size={16} className="mr-1" /> How it works
          </Button>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center">How hayon works</h2>

          <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
            hayon help people to reduce time your social account managing
          </p>
        </div>

        {/* Responsive Grid for How it works */}
        <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-4 w-full max-w-6xl mx-auto" style={{ minHeight: '50vh' }}>
          {/* On mobile: simple stacked cards, on desktop: original complex grid */}
          <CardImage className="lg:col-span-2 lg:row-span-2 min-h-[150px] sm:min-h-[180px]" />
          <CardImage className="lg:col-span-2 lg:row-span-6 min-h-[150px] sm:min-h-[180px] lg:min-h-0" />
          <CardImage className="lg:col-span-2 lg:row-span-4 min-h-[150px] sm:min-h-[180px]" />
          <CardImage className="lg:col-span-2 lg:row-span-4 min-h-[150px] sm:min-h-[180px]" />
          <CardImage className="lg:col-span-2 lg:row-span-2 min-h-[150px] sm:min-h-[180px]" />
        </div>
      </section>

      {/* Powerful Features Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="flex items-center flex-col gap-3 md:gap-4 justify-center">
          <Button variant={"icon_outline"} className="text-sm md:text-base">
            <Sparkles size={16} className="mr-1" /> Features
          </Button>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center max-w-lg leading-tight">
            Powerful Features to Grow Your Audience
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12  md:gap-8 w-full max-w-5xl mx-auto">
          {/* AI Caption Generation */}
          <div className="flex flex-col gap-4 px-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-ring rounded-xl flex items-center justify-center border border-gray-200">
              <FileText size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold px-2">AI Caption Generation</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
              Let our AI do copywriting, get the best caption for your photo or product.
            </p>
            {/* AI Caption Image */}
            <CardImage className="min-h-[180px] sm:min-h-[200px] mt-2" />
          </div>

          {/* Multi-Platform Scheduling */}
          <div className="flex flex-col gap-4 px-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-ring rounded-xl flex items-center justify-center border border-gray-200">
              <Calendar size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold px-2">Multi-Platform Scheduling</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
              Plan and schedule posts across all your favorite platforms at once.
            </p>
            {/* Multi-Platform Image */}
            <CardImage className="min-h-[180px] sm:min-h-[200px] mt-2" />
          </div>

          {/* Performance Analytics */}
          <div className="flex flex-col gap-4 px-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-ring rounded-xl flex items-center justify-center border border-gray-200">
              <BarChart3 size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold px-2">Performance Analytics</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
              Track your growth with deep insights and real-time data for your accounts.
            </p>
            {/* Performance Analytics Image */}
            <CardImage className="min-h-[180px] sm:min-h-[200px] mt-2" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-4 md:p-8 lg:p-16">
        <div className="gradient rounded-xl md:rounded-2xl lg:rounded-3xl py-16 md:py-24 lg:py-32 px-6 md:px-12 flex flex-col items-center justify-center gap-8 md:gap-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <FileText size={32} className="text-gray-700" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white text-center max-w-lg leading-tight">
            Your Money, your choice. Hayon
          </h2>

          <Link href="/register">
            <Button variant={"black"} className="px-8 md:px-12 py-5 md:py-6 text-base md:text-lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-8 bg-background border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src={logo_IMG} alt="Hayon logo" className="w-6 h-6" />
            <span className="font-semibold">Hayon</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © 2026 Hayon. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}