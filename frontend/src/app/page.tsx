"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo_IMG from "@/assets/logo.png";
import { BookOpen, Book } from "lucide-react";
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

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        try {
          const { data } = await api.post('/auth/refresh');
          setAccessToken(data.data.accessToken);
        } catch{
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
      } catch{
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Main page */}
      <section className="p-8 min-h-screen bg-backround">
        <div className="gradient min-h-screen rounded-xl relative">
          {/* Navigation BAR */}
          <nav className="flex items-between justify-between px-8 py-8">
            <div>
              <Image src={logo_IMG} alt="logo" />
            </div>

            <div className="flex gap-4">
              <Button variant={"outline"}>What is hayon</Button>

              <Link href="/pricing">
                <Button variant={"outline"}>Pricing</Button>
              </Link>

              <Link href="/login">
                <Button variant={"outline"}>Login</Button>
              </Link>
            </div>

            <div>
              <Button variant={"black"}>Start Free Trial</Button>
            </div>
          </nav>

          {/* Hero */}
          <main>
            <div className="flex justify-center items-center gap-18 flex-col mt-25">
              <h1 className="text-6xl w-1/2 text-center font-semi-bold">
                Automate Your Social Media with AI
              </h1>

              <button className="px-8 py-5 bg-background rounded-full text-xl">
                Sign Up{" "}
                <span className="ml-15 bg-foreground px-5 py-2 rounded-full text-lg text-background">
                  Now
                </span>
              </button>
            </div>

            {/* image */}
            <div className="px-8 pt-8 w-full mt-20">
              <div className="bg-black h-[90vh] rounded-t-xl px-8 pt-8">
                <div className="h-full rounded-t-x bg-cover bg-center"></div>
              </div>
            </div>
          </main>
        </div>
      </section>

      <section className="min-h-screen">
        <div className="flex items-center flex-col gap-3 justify-center mt-7">
          <h1>
            <Button variant={"icon_outline"}>
              <BookOpen size={18} /> How it works
            </Button>
          </h1>

          <h1 className="text-4xl">How hayon works</h1>

          <p>hayon help people to reduce time your social account managing</p>
        </div>

        <div className="parent mt-5 h-[70vh] w-full px-18">
          <CardImage className="div1 " />
          <CardImage className="div2 " />
          <CardImage className="div3 " />
          <CardImage className="div4 " />
          <CardImage className="div5 " />
        </div>
      </section>

      <section className="min-h-screen">
        <div className="flex items-center flex-col gap-3 justify-center mt-7">
          <h1>
            <Button variant={"icon_outline"}>
              <Book size={18} /> How it works
            </Button>
          </h1>

          <h1 className="text-4xl w-1/3 text-center">
            Powerful Features To Grow Your Audience
          </h1>
        </div>
      </section>
    </div>
  );
}