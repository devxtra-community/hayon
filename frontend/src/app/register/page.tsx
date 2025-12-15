import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";
import logo_IMG from "@/assets/logo.png";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-12">
          <div>
            <Image src={logo_IMG} alt="Hayon Logo" className="mb-8" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Join Hayon Today
            </h1>
            <p className="text-xl text-muted-foreground">
              Start automating your social media with AI in just a few minutes
            </p>
          </div>

          <div className="gradient rounded-2xl p-8 text-white space-y-4">
            <h3 className="text-2xl font-semibold">What youll get</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>5 free AI-generated posts per month</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Connect 1 social media account</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Basic analytics dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-1 shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Upgrade anytime to Pro</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex justify-center">
              <Image src={logo_IMG} alt="Hayon Logo" />
            </div>
            
            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
}