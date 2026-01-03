'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearAccessToken } from '@/lib/axios';
import logo_IMG from '@/assets/logo.png';
import {
    LayoutDashboard,
    Calendar,
    BarChart3,
    Clock,
    FileEdit,
    Settings,
    LogOut
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

const menuItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Calendar', href: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Analytics', href: '/analytics', icon: <BarChart3 size={20} /> },
    { name: 'History', href: '/history', icon: <Clock size={20} /> },
    { name: 'Drafts', href: '/drafts', icon: <FileEdit size={20} /> },
];

const generalItems: NavItem[] = [
    { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.delete('/auth/logout');
            clearAccessToken();
            router.push('/login');
        } catch (error) {
            console.error(error);
            alert('Logout failed');
        }
    };

    const isActive = (href: string) => pathname === href;

    return (
        <aside className="w-64 h-full bg-[#F7F7F7] rounded-xl flex flex-col shadow-sm">
            {/* Logo */}
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src={logo_IMG} alt="Hayon" className="w-8 h-8" />
                    <span className="text-xl font-semibold text-gray-900">Hayon</span>
                </Link>
            </div>

            {/* Menu Section */}
            <div className="px-4 mt-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">Menu</p>
                <nav className="space-y-4">
                    {menuItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <div key={item.name} className="relative flex items-center">
                                {active && (
                                    <div className="absolute -left-4 w-1.5 h-10 bg-primary rounded-r-md shadow-[0_0_10px_rgba(49,141,98,0.3)]" />
                                )}
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-2 w-full transition-all duration-200 ${active
                                        ? 'text-gray-900 font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <span className={`transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">General</p>
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
                                    className={`flex items-center gap-4 px-4 py-2 w-full transition-all duration-200 ${active
                                        ? 'text-gray-900 font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <span className={`transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-base">{item.name}</span>
                                </Link>
                            </div>
                        );
                    })}

                    {/* Logout Button */}
                    <div className="relative flex items-center">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 px-4 py-2 w-full text-gray-500 hover:text-gray-900 transition-all duration-200"
                        >
                            <span className="text-gray-400">
                                <LogOut size={20} />
                            </span>
                            <span className="text-base">Logout</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Spacer */}
            <div className="flex-1" />
        </aside>
    );
}
