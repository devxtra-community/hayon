"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo_IMG from "@/assets/logo.png";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Clock,
  FileEdit,
  Settings,
  Plus,
  Smartphone,
  ChevronDown,
  Bell,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  subItems?: { name: string; href: string; icon: React.ReactNode }[];
}

const menuItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
    subItems: [
      { name: "Create Post", href: "/dashboard/create-post", icon: <Plus size={16} /> },
      { name: "Manage Devices", href: "/dashboard/devices", icon: <Smartphone size={16} /> },
    ],
  },
  { name: "Calendar", href: "/calendar", icon: <Calendar size={20} /> },
  { name: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
  { name: "History", href: "/history", icon: <Clock size={20} /> },
  { name: "Drafts", href: "/drafts", icon: <FileEdit size={20} /> },
];

const generalItems: NavItem[] = [
  { name: "Notifications", href: "/settings/notifications", icon: <Bell size={20} /> },
  { name: "Settings", href: "/settings", icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [expandedItem, setExpandedItem] = useState<string | null>(
    pathname?.startsWith("/dashboard") ? "Dashboard" : null,
  );

  useEffect(() => {
    setExpandedItem(pathname?.startsWith("/dashboard") ? "Dashboard" : null);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) =>
    isActive(item.href) || item.subItems?.some((sub) => isActive(sub.href));

  return (
    <aside className="w-64 h-full bg-[#F7F7F7] lg:rounded-[2rem] rounded-r-2xl flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center py-5 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src={logo_IMG} alt="Hayon" className="w-8 h-8" />
          <span className="text-xl font-semibold text-gray-900">Hayon</span>
        </Link>
      </div>

      {/* Menu Section */}
      <div className="px-4 mt-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">
          Menu
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isParentActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItem === item.name;

            return (
              <div key={item.name} className="relative">
                {active && (
                  <div className="absolute -left-4 top-0 w-1.5 h-10 bg-primary rounded-r-md shadow-[0_0_10px_rgba(49,141,98,0.3)]" />
                )}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-2 flex-1 transition-all duration-200 ${
                      active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`transition-colors ${active ? "text-primary" : "text-gray-400"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-base">{item.name}</span>
                  </Link>
                  {hasSubItems && (
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.name)}
                      className="p-2 mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-all duration-200"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items dropdown */}
                {hasSubItems && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-8 pl-4 border-l-2 border-gray-200 mt-1 mb-2 space-y-1">
                      {item.subItems!.map((sub) => {
                        const subActive = isActive(sub.href);
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              subActive
                                ? "text-primary font-semibold bg-primary/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <span
                              className={`transition-colors ${subActive ? "text-primary" : "text-gray-400"}`}
                            >
                              {sub.icon}
                            </span>
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  <div className="absolute -left-4 w-1.5 h-10 bg-primary rounded-r-md shadow-[0_0_10px_rgba(49,141,98,0.3)]" />
                )}
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-2 w-full transition-all duration-200 ${
                    active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`transition-colors ${active ? "text-primary" : "text-gray-400"}`}
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

      {/* Spacer */}
      <div className="flex-1" />
    </aside>
  );
}
