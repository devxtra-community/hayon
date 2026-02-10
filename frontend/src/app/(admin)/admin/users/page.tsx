"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AdminSidebar, AdminHeader, UsersTable } from "@/components/admin";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
  isActive: boolean;
  plan: "free" | "starter" | "professional" | "enterprise";
  createdAt: string;
  lastLogin?: string;
}

type PlanType = "free" | "starter" | "professional" | "enterprise";

const mockUsers: ManagedUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
    role: "user",
    isActive: true,
    plan: "professional",
    createdAt: "2024-01-15T10:30:00Z",
    lastLogin: "2024-01-05T08:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=random",
    role: "user",
    isActive: true,
    plan: "starter",
    createdAt: "2024-02-20T14:45:00Z",
    lastLogin: "2024-01-04T16:30:00Z",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=random",
    role: "user",
    isActive: false,
    plan: "free",
    createdAt: "2024-03-10T09:15:00Z",
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah@example.com",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Williams&background=random",
    role: "user",
    isActive: true,
    plan: "enterprise",
    createdAt: "2024-01-05T11:20:00Z",
    lastLogin: "2024-01-05T10:00:00Z",
  },
  {
    id: "5",
    name: "Alex Brown",
    email: "alex@example.com",
    avatar: "https://ui-avatars.com/api/?name=Alex+Brown&background=random",
    role: "user",
    isActive: true,
    plan: "professional",
    createdAt: "2024-04-01T08:00:00Z",
    lastLogin: "2024-01-03T14:15:00Z",
  },
  {
    id: "6",
    name: "Emily Davis",
    email: "emily@example.com",
    avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=random",
    role: "user",
    isActive: true,
    plan: "free",
    createdAt: "2024-05-15T16:30:00Z",
  },
  {
    id: "7",
    name: "Chris Wilson",
    email: "chris@example.com",
    avatar: "https://ui-avatars.com/api/?name=Chris+Wilson&background=random",
    role: "user",
    isActive: false,
    plan: "starter",
    createdAt: "2024-06-20T12:00:00Z",
  },
  {
    id: "8",
    name: "Rachel Green",
    email: "rachel@example.com",
    avatar: "https://ui-avatars.com/api/?name=Rachel+Green&background=random",
    role: "user",
    isActive: true,
    plan: "professional",
    createdAt: "2024-07-10T09:45:00Z",
    lastLogin: "2024-01-05T07:30:00Z",
  },
  {
    id: "9",
    name: "David Miller",
    email: "david@example.com",
    avatar: "https://ui-avatars.com/api/?name=David+Miller&background=random",
    role: "user",
    isActive: true,
    plan: "starter",
    createdAt: "2024-08-22T13:00:00Z",
    lastLogin: "2024-01-04T09:20:00Z",
  },
  {
    id: "10",
    name: "Lisa Anderson",
    email: "lisa@example.com",
    avatar: "https://ui-avatars.com/api/?name=Lisa+Anderson&background=random",
    role: "user",
    isActive: true,
    plan: "enterprise",
    createdAt: "2024-09-05T10:15:00Z",
    lastLogin: "2024-01-05T11:45:00Z",
  },
  {
    id: "11",
    name: "Tom Harris",
    email: "tom@example.com",
    avatar: "https://ui-avatars.com/api/?name=Tom+Harris&background=random",
    role: "user",
    isActive: false,
    plan: "free",
    createdAt: "2024-10-18T15:30:00Z",
  },
  {
    id: "12",
    name: "Sophie Turner",
    email: "sophie@example.com",
    avatar: "https://ui-avatars.com/api/?name=Sophie+Turner&background=random",
    role: "user",
    isActive: true,
    plan: "professional",
    createdAt: "2024-11-25T08:45:00Z",
    lastLogin: "2024-01-05T06:00:00Z",
  },
];

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(mockUsers);

  // Lifted state for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  const handleUserUpdate = (userId: string, updates: Partial<ManagedUser>) => {
    setManagedUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <AdminSidebar />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <AdminHeader
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterSlot={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full h-11 px-4 gap-2 bg-white border-none shadow-none hover:bg-gray-100 transition-colors"
                  >
                    <Filter size={18} className="text-gray-900" />
                    <span className="text-sm font-medium text-gray-900">Filter</span>
                    {(planFilter !== "all" || statusFilter !== "all") && (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 rounded-2xl shadow-xl border-gray-100"
                >
                  <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
                    Plan Type
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={planFilter}
                    onValueChange={(v) => setPlanFilter(v as PlanType | "all")}
                  >
                    <DropdownMenuRadioItem value="all" className="rounded-xl">
                      All Plans
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="free" className="rounded-xl">
                      Free
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="starter" className="rounded-xl">
                      Starter
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="professional" className="rounded-xl">
                      Professional
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="enterprise" className="rounded-xl">
                      Enterprise
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
                    Status
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
                  >
                    <DropdownMenuRadioItem value="all" className="rounded-xl">
                      All Status
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active" className="rounded-xl">
                      Active
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive" className="rounded-xl">
                      Inactive
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pt-2">
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-sm text-gray-500">
              View and manage all registered users, their status, and subscription plans.
            </p>
          </div>
          <UsersTable
            users={managedUsers}
            onUserUpdate={handleUserUpdate}
            searchQuery={searchQuery}
            planFilter={planFilter}
            statusFilter={statusFilter}
          />
        </main>
      </div>
    </div>
  );
}
