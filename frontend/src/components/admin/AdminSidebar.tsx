"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { api, clearAccessToken } from "@/lib/axios";
import logo_IMG from "@/assets/logo.png";

import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
  { name: "Users", href: "/admin/users", icon: <Users size={20} /> },
  { name: "Plans", href: "/admin/plans", icon: <CreditCard size={20} /> },
  { name: "Analytics", href: "/admin/analytics", icon: <BarChart3 size={20} /> },
];

const generalItems: NavItem[] = [
  { name: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await api.delete("/auth/logout");
      clearAccessToken();
      router.push("/login");
    } catch (error) {
      console.error(error);
      showToast("error", "Logout failed", "Please try again.");
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-64 h-full bg-[#F7F7F7] rounded-xl flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image width={200} height={200} src={logo_IMG} alt="Hayon" className="w-8 h-8" />
          <span className="text-xl font-semibold text-gray-900">Hayon</span>
          <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md">
            Admin
          </span>
        </Link>
      </div>

      {/* Menu Section */}
      <div className="px-4 mt-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">
          Menu
        </p>
        <nav className="space-y-4">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.name} className="relative flex items-center">
                {active && (
                  <div className="absolute -left-4 w-1.5 h-10 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-md shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                )}
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-2 w-full transition-all duration-200 ${
                    active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`transition-colors ${active ? "text-red-500" : "text-gray-400"}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-base">{item.name}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* General Section */}
      <div className="px-4 mt-12 mb-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">
          General
        </p>
        <nav className="space-y-4">
          {generalItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.name} className="relative flex items-center">
                {active && (
                  <div className="absolute -left-4 w-1.5 h-10 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-md shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                )}
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-2 w-full transition-all duration-200 ${
                    active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`transition-colors ${active ? "text-red-500" : "text-gray-400"}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-base">{item.name}</span>
                </Link>
              </div>
            );
          })}

          {/* Logout Button */}
          <div className="relative flex items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-4 px-4 py-2 w-full text-gray-500 hover:text-gray-900 transition-all duration-200">
                  <span className="text-gray-400">
                    <LogOut size={20} />
                  </span>
                  <span className="text-base">Logout</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will need to log in again to access the
                    admin dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Admin Badge */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin Mode</p>
            <p className="text-xs text-gray-500">Full access enabled</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
