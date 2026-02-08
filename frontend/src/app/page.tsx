"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
const logo_IMG = "/images/logos/logo.png";
import {
  Sparkles,
  Menu,
  X,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Rocket,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { SwipeButton } from "@/components/ui/swipe-button";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { api, setAccessToken, getAccessToken } from "@/lib/axios";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

const WorkflowStep = ({ step, idx }: { step: any; idx: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // Scale the icon when it's at the center
  const iconScale = useTransform(scrollYProgress, [0.8, 1, 1.2], [1, 1.2, 1]);
  const iconSpringScale = useSpring(iconScale, {
    stiffness: 300,
    damping: 20,
  });

  return (
    <div
      ref={ref}
      className={`relative flex flex-row md:flex-row items-center w-full ${
        step.side === "left" ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Content Side */}
      <motion.div
        initial={{ opacity: 0, x: step.side === "right" ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`w-full md:w-1/2 pl-12 pr-4 md:px-8 ${
          step.side === "right" ? "md:pl-24" : "md:pr-24 md:text-right"
        }`}
      >
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider"
          style={{ backgroundColor: step.lightColor, color: step.color }}
        >
          Step {idx + 1}
        </div>
        <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-4" style={{ color: step.color }}>
          {step.title}
        </h3>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md inline-block">
          {step.description}
        </p>
      </motion.div>

      {/* Center Circle & Connections */}
      <div className="absolute left-8 md:relative md:left-0 hidden md:flex items-center justify-center md:my-0 -translate-x-1/2 md:translate-x-0 z-20">
        {/* The Circle */}
        <motion.div
          style={{ scale: iconSpringScale }}
          className="relative z-30 w-12 h-12 md:w-24 md:h-24 rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] md:shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center border border-gray-100 transition-transform duration-300 group"
        >
          <div
            style={{ color: step.color }}
            className="transition-transform group-hover:scale-110 duration-300 scale-75 md:scale-100"
          >
            {step.icon}
          </div>
        </motion.div>
      </div>

      {/* Empty Side (for layout) */}
      <div className="hidden md:block md:w-1/2" />
    </div>
  );
};

const TimelineSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const dotY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      icon: <FileText size={28} />,
      title: "Create a Post",
      description: "Start with your idea and create a post effortlessly with our intuitive editor.",
      color: "#318d62",
      lightColor: "rgba(49, 141, 98, 0.1)",
      side: "right",
    },
    {
      icon: <Sparkles size={28} />,
      title: "AI Captions",
      description:
        "Generate engaging, AI-driven captions tailored to your brand's voice and audience.",
      color: "#318d62",
      lightColor: "rgba(49, 141, 98, 0.1)",
      side: "left",
    },
    {
      icon: <Calendar size={28} />,
      title: "Smart Scheduling",
      description: "Schedule your content for peak engagement times to maximize your reach.",
      color: "#318d62",
      lightColor: "rgba(49, 141, 98, 0.1)",
      side: "right",
    },
    {
      icon: <Rocket size={28} />,
      title: "Auto-Publish",
      description:
        "Hayon automatically publishes your content across all platforms in the background.",
      color: "#318d62",
      lightColor: "rgba(49, 141, 98, 0.1)",
      side: "left",
    },
    {
      icon: <BarChart3 size={28} />,
      title: "Deep Analytics",
      description:
        "Track performance with detailed insights to improve and grow your future content.",
      color: "#318d62",
      lightColor: "rgba(49, 141, 98, 0.1)",
      side: "right",
    },
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto relative px-4 md:px-0 isolate">
      {/* Vertical Connecting Line (Background) */}
      <div
        className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-gray-100 -translate-x-1/2 block"
        style={{ zIndex: 1 }}
      />

      {/* Vertical Connecting Line (Animated Fill) */}
      <motion.div
        style={{ scaleY, originY: 0, zIndex: 2 }}
        className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-[#318d62] -translate-x-1/2 block"
      />

      {/* Animated Dot on Central Line */}
      <motion.div
        style={{ top: dotY, zIndex: 3 }}
        className="absolute left-8 md:left-1/2 w-4 h-4 bg-[#318d62] rounded-full -translate-x-1/2 flex items-center justify-center shadow-[0_0_15px_rgba(49,141,98,0.5)]"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </motion.div>

      {/* Steps Timeline */}
      <div className="relative flex flex-col gap-16 md:gap-32" style={{ zIndex: 10 }}>
        {steps.map((step, idx) => (
          <WorkflowStep key={idx} step={step} idx={idx} />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        try {
          const { data } = await api.post("/auth/refresh");
          setAccessToken(data.data.accessToken);
        } catch {
          setIsChecking(false);
          return;
        }
      }

      // User has valid token - check their role
      try {
        const { data } = await api.get("/auth/me");
        const user: User = data.data.user;

        if (user.role === "user") {
          router.push("/dashboard");
          return;
        } else if (user.role === "admin") {
          router.push("/admin/dashboard");
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden relative">
      {/* Global Dot Pattern Background */}
      <div
        className="fixed inset-0 z-0 opacity-[0.8] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-0 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-between pt-6 pb-12 px-6">
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
                <Button variant={"outline"} className="w-full py-6 text-lg">
                  What is Hayon
                </Button>
              </Link>
              <Link href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"outline"} className="w-full py-6 text-lg">
                  Login
                </Button>
              </Link>
              <Link href="/pricing" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"outline"} className="w-full py-6 text-lg">
                  Pricing
                </Button>
              </Link>
            </div>

            {/* CTA Button */}
            <div className="w-full max-w-xs">
              <Link href="/register" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={"black"} className="w-full py-6 text-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col relative z-10">
        {/* Main Card Container */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Navigation BAR */}
          <nav className="relative z-0 flex items-center justify-between px-6 md:px-12 py-6">
            <div className="flex items-center gap-2">
              <Image
                src={logo_IMG}
                alt="Hayon Logo"
                width={25}
                height={25}
                className="w-4 h-4 md:w-5 md:h-5"
              />
              <span className="font-bold text-xl tracking-tight hidden md:block">Hayon</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <span className="hover:text-black cursor-pointer transition-colors">Features</span>
              <span className="hover:text-black cursor-pointer transition-colors">Solutions</span>
              <Link href="/pricing" className="hover:text-black cursor-pointer transition-colors">
                Pricing
              </Link>
              <span className="hover:text-black cursor-pointer transition-colors">Resources</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden md:block text-sm font-medium hover:text-black transition-colors"
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button
                  variant={"outline"}
                  className="hidden md:flex rounded-full px-6 border-gray-200 hover:bg-gray-50 text-gray-900"
                >
                  Get started
                </Button>
              </Link>
              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Menu size={24} className="text-gray-900" />
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <main className="relative z-0 flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-0">
            {/* Central Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-4 bg-white rounded-2xl shadow-xl shadow-gray-200/50"
            >
              <Image src={logo_IMG} alt="Hayon Logo" width={40} height={40} className="w-10 h-10" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-center tracking-tight text-gray-900 leading-[1.1] max-w-4xl mx-auto"
            >
              Think, plan, and post <br />
              <span className="text-gray-400">all in one place</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg md:text-xl text-gray-500 text-center max-w-lg mx-auto"
            >
              Efficiently manage your social media content and boost audience engagement with AI.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10"
            >
              <SwipeButton
                onSwipeComplete={() => router.push("/register")}
                text="Get started for free"
              />
            </motion.div>

            {/* Floating Elements - Absolute Positioned for Desktop, Hidden/Adapted for Mobile */}

            {/* Top Left - Sticky Note */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden lg:block absolute top-[15%] left-[2%] rotate-[-6deg] hover:rotate-0 transition-transform duration-300 z-0"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-[#FEF9C3] p-6 rounded-sm shadow-xl w-64 transform"
              >
                <div className="w-3 h-3 rounded-full bg-[#EAB308] mx-auto -mt-8 mb-4 shadow-sm border border-white/50"></div>
                <p className="font-handwriting text-gray-800 text-lg leading-snug">
                  Launch the new product campaign on Tuesday! <br />
                  <span className="text-sm opacity-70 mt-2 block">- Don't forget formatting</span>
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/60 border border-black/5"></div>
                  <div className="w-8 h-8 rounded-full bg-white/60 border border-black/5"></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Top Right - Reminder Notification */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hidden lg:block absolute top-[18%] right-[2%] z-0"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="bg-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-72"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Post Scheduled</h4>
                    <p className="text-xs text-gray-500">Instagram • Today, 9:00 AM</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-md bg-gray-200 shrink-0"></div>
                  <div className="w-full">
                    <div className="h-2 w-3/4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="h-2 w-1/2 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Left - Analytics Card */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="hidden lg:block absolute bottom-[8%] left-[2%] z-0"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
                className="bg-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-80"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-gray-700">Engagement</h4>
                  <span className="text-green-500 text-sm font-bold bg-green-50 px-2 py-1 rounded-full">
                    +24%
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Likes</span>
                      <span>1,240</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="h-full bg-[#318d62] rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Shares</span>
                      <span>856</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "45%" }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        className="h-full bg-indigo-500 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Right - Intergrations */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="hidden lg:block absolute bottom-[8%] right-[2%] z-0"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.2 }}
                className="bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100"
              >
                <p className="text-gray-500 text-sm font-medium mb-4">Seamless Integration</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 shadow-md flex items-center justify-center text-white">
                    <span className="font-bold text-xl">Ig</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-500 shadow-md flex items-center justify-center text-white">
                    <span className="font-bold text-xl">In</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-black shadow-md flex items-center justify-center text-white">
                    <span className="font-bold text-xl">X</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <span className="text-xl">+</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </section>

      {/* How Hayon Works Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 relative z-10">
        <div className="flex items-center flex-col gap-4 mb-16 md:mb-24 justify-center">
          <Button
            variant={"icon_outline"}
            className="text-sm md:text-base bg-gray-50 rounded-full px-5 h-10 border-gray-100"
          >
            How it Works
          </Button>

          <h2 className="text-3xl md:text-5xl font-bold text-center tracking-tight">
            Elevate your workflow
          </h2>

          <p className="text-base md:text-lg text-muted-foreground text-center max-w-xl">
            Hayon streamlines your social media management with a simple yet powerful process.
          </p>
        </div>

        <TimelineSection />
      </section>

      {/* Solutions and Features Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 lg:px-16 relative z-10s border-y border-gray-100/50">
        <div className="max-w-7xl mx-auto">
          {/* Solutions Part */}

          {/* Features Grid Part */}
          <div className="flex flex-col items-center p-6 md:p-12 lg:p-20 border border-gray-100 ">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Button
                variant={"icon_outline"}
                className="text-sm md:text-base bg-gray-50 rounded-full px-5 h-10 border-gray-100"
              >
                Features
              </Button>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
              Keep everything in one place
            </h2>
            <p className="text-gray-500 text-lg mb-16 text-center">
              Forget complex project management tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 w-full">
              {/* Seamless Collaboration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="md:col-span-6 bg-[#f8f9fb] rounded-[2rem] p-8 border border-gray-100/50 flex flex-col items-center text-center group transition-all"
              >
                <div className="w-full aspect-video md:aspect-square lg:aspect-video relative mb-8 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <Image
                    src="/images/mockups/snippets.png"
                    alt="Collaboration"
                    fill
                    className="object-none object-top-left scale-[1.2] transition-transform duration-500 group-hover:scale-[1.3]"
                    style={{ objectPosition: "0% 0%" }}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">Seamless Collaboration</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                  Work together with your team effortlessly, share tasks, and update progress in
                  real-time.
                </p>
              </motion.div>

              {/* Time Management Tools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -8 }}
                className="md:col-span-6 bg-[#f8f9fb] rounded-[2rem] p-8 border border-gray-100/50 flex flex-col items-center text-center group transition-all"
              >
                <div className="w-full aspect-video md:aspect-square lg:aspect-video relative mb-8 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <Image
                    src="/images/mockups/snippets.png"
                    alt="Time Management"
                    fill
                    className="object-none transition-transform duration-500 group-hover:scale-[1.1]"
                    style={{ objectPosition: "100% 0%" }}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">Time Management Tools</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                  Optimize your time with integrated tools like timers, reminders, and schedules.
                </p>
              </motion.div>

              {/* Advanced task tracking (Wider) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -8 }}
                className="md:col-span-8 bg-[#f8f9fb] rounded-[2rem] p-8 md:p-10 border border-gray-100/50 flex flex-col md:grid md:grid-cols-2 items-center gap-8 group transition-all"
              >
                <div className="text-left">
                  <div className="w-12 h-12 rounded-xl bg-orange-100/50 text-orange-500 flex items-center justify-center mb-6">
                    <ChevronRight size={24} strokeWidth={3} className="rotate-[-45deg]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3">Advanced task tracking</h3>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                    A bird's eye view of your entire behaviour and productivity.
                  </p>
                </div>
                <div className="w-full aspect-video relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm self-stretch">
                  <Image
                    src="/images/mockups/snippets.png"
                    alt="Task Tracking"
                    fill
                    className="object-none transition-transform duration-500 group-hover:scale-[1.1]"
                    style={{ objectPosition: "0% 100%" }}
                  />
                </div>
              </motion.div>

              {/* Customizable Workspaces (Narrower) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -8 }}
                className="md:col-span-4 bg-[#f8f9fb] rounded-[2rem] p-8 border border-gray-100/50 flex flex-col items-center text-center group transition-all"
              >
                <div className="w-full aspect-square relative mb-6 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <Image
                    src="/images/mockups/snippets.png"
                    alt="Customizable"
                    fill
                    className="object-none transition-transform duration-500 group-hover:scale-[1.2]"
                    style={{ objectPosition: "100% 100%" }}
                  />
                </div>
                <h3 className="text-lg md:text-xl font-bold">Customizable Workspaces</h3>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="mt-12 text-gray-400 font-medium italic"
            >
              and a lot more features...
            </motion.p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-4 md:p-13 lg:p-30 relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-white rounded-[2.5rem] md:rounded-[4rem] py-20 md:py-32 px-6 md:px-12 flex flex-col items-center justify-center gap-10 overflow-hidden border border-gray-100 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)]"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large Soft Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#318d62]/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full"></div>

            {/* Subtle Dot Pattern */}
            <div
              className="absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 md:gap-10">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Button
                  variant={"icon_outline"}
                  className="text-sm md:text-base bg-[#f8f9fb] rounded-full px-6 h-12 border-gray-100 text-[#318d62] font-semibold"
                >
                  Get Started Today
                </Button>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 text-center max-w-4xl leading-[1.1] tracking-tight">
                Ready to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#318d62] to-[#5fc294]">
                  amplify
                </span>{" "}
                your <br className="hidden md:block" />
                social presence?
              </h2>
            </div>

            {/* <p className="text-gray-500 text-lg md:text-xl text-center max-w-lg mx-auto leading-relaxed">
              Think, plan, and post all in one place. Join thousands of creators using Hayon to grow their brand.
            </p> */}

            <motion.div className="mt-4" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <SwipeButton
                onSwipeComplete={() => router.push("/pricing")}
                text="Start using free plan"
              />
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8 mt-4">
              {["Free 30 day plan", "No credit card required", "Cancel anytime"].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-gray-400 text-sm md:text-base font-medium"
                >
                  <div className="w-2 h-2 rounded-full bg-[#318d62]/30" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Animated Floaties - Subtle and matches the Hero feel */}
          <motion.div
            animate={{
              y: [0, -25, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute left-[8%] top-[20%] hidden lg:block"
          >
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">
              <Sparkles size={28} className="text-[#318d62]" />
            </div>
          </motion.div>

          <motion.div
            animate={{
              y: [0, 25, 0],
              rotate: [0, -5, 0],
            }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute right-[8%] bottom-[25%] hidden lg:block"
          >
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">
              <Rocket size={32} className="text-indigo-500" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src={logo_IMG} alt="Hayon logo" className="w-6 h-6" width={24} height={24} />
            <span className="font-semibold">Hayon</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © 2026 Hayon. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
