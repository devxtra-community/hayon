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
import type { DeepPartial, IUser, SubscriptionPlan } from "@/types/user.types";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null); //TODO :: ANDD A TYPE FOR uSER
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [managedUsers, setManagedUsers] = useState<IUser[]>([]);

  // Lifted state for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");
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

  // Supperating for
  useEffect(() => {
    const fetchManagedUsers = async () => {
      try {
        const { data } = await api.get("/admin/get-all-users");
        setManagedUsers(data.data);
      } catch (error) {
        console.error("Failed to fetch managed users", error);
      }
    };

    fetchManagedUsers();
  }, []);

  const handleUserUpdate = (userId: string, updates: DeepPartial<IUser>) => {
    setManagedUsers((prev) =>
      prev.map((u) => {
        if (u._id !== userId) return u;
        return {
          ...u,
          ...updates,
          auth: updates.auth ? { ...u.auth, ...updates.auth } : u.auth,
          subscription: updates.subscription
            ? { ...u.subscription, ...updates.subscription }
            : u.subscription,
          usage: updates.usage ? { ...u.usage, ...updates.usage } : u.usage,
          limits: updates.limits ? { ...u.limits, ...updates.limits } : u.limits,
        };
      }),
    );
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
                    onValueChange={(v) => setPlanFilter(v as SubscriptionPlan | "all")}
                  >
                    <DropdownMenuRadioItem value="all" className="rounded-xl">
                      All Plans
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="free" className="rounded-xl">
                      Free
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pro" className="rounded-xl">
                      Pro
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
