import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const poppins = Poppins({
  variable: "--font-poppins-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Hayon",
  description:
    "A full-stack social media management platform that enables multi-platform post creation, scheduling, AI-generated captions, background job processing, and centralized analytics using a scalable, production-oriented architecture.",
  icons: {
    icon: [
      { url: "/images/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/images/logos/apple-touch-icon.png",
    shortcut: "/images/logos/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
