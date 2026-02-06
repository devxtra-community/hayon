import LoginForm from "@/components/LoginForm";
import Image from "next/image";
const logo_IMG = "/images/logos/logo.png";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-12">
          <div>
            <Image src={logo_IMG} alt="Hayon Logo" className="mb-8" width={64} height={64} />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-xl text-muted-foreground">
              Automate your social media with AI-powered content generation
            </p>
          </div>
          <div className="gradient rounded-2xl p-8 text-white space-y-4">
            <h3 className="text-2xl font-semibold">Why Hayon?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>AI-powered content in seconds</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Schedule posts across platforms</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Analytics and insights</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex justify-center">
              <Image src={logo_IMG} alt="Hayon Logo" width={48} height={48} />
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
