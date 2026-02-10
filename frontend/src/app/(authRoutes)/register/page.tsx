import AuthImageCarousel from "@/components/AuthImageCarousel";
import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[1200px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* Left Side: Register Form & Mobile Content */}
        <div className="lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 lg:px-20 relative">
          <div className="w-full max-w-[400px]">
            {/* Heading - Now on top in both views */}
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-3 tracking-tight">
                Join Hayon
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed">
                Start your journey with <span className="font-semibold text-zinc-900">Hayon</span>.
                Experience the next level of social automation.
              </p>
            </div>

            {/* Mobile Illustration Component - Visible only on mobile, placed between title and form */}
            <div className="lg:hidden mb-10">
              <div className="w-full bg-[#f1fcf5] rounded-[2rem] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-6 left-6 w-16 h-16 bg-white/50 rounded-full blur-2xl" />
                <div className="absolute bottom-6 right-6 w-24 h-24 bg-emerald-100/30 rounded-full blur-3xl" />
                <div className="relative z-10 w-full">
                  <AuthImageCarousel />
                </div>
              </div>
            </div>

            <RegisterForm />

            <div className="mt-10 text-center">
              <p className="text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Desktop Illustration Container */}
        <div className="hidden lg:block lg:w-1/2 p-4 lg:p-6">
          <div className="h-full w-full bg-[#f1fcf5] rounded-[2rem] flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/50 rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-emerald-100/30 rounded-full blur-3xl" />

            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <AuthImageCarousel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
