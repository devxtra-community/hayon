"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  MoreVertical,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Crown,
  Zap,
} from "lucide-react";
import { api } from "@/lib/axios";
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
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import type { DeepPartial, IUser, SubscriptionPlan } from "@/types/user.types";

interface UsersTableProps {
  users: IUser[];
  onUserUpdate: (userId: string, updates: DeepPartial<IUser>) => void;
  searchQuery: string;
  planFilter: SubscriptionPlan | "all";
  statusFilter: "all" | "active" | "inactive";
}

const planConfig: Record<
  SubscriptionPlan,
  { label: string; color: string; icon: React.ReactNode }
> = {
  free: {
    label: "Free",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <Zap size={12} />,
  },

  pro: {
    label: "Professional",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Crown size={12} />,
  },
};

export default function UsersTable({
  users,
  onUserUpdate,
  searchQuery,
  planFilter,
  statusFilter,
}: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    action: "enable" | "disable" | "changePlan";
    newPlan?: SubscriptionPlan;
    userName?: string;
  }>({ open: false, userId: "", action: "enable" });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { showToast } = useToast();
  const itemsPerPage = 10;

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || user.subscription?.plan === planFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isDisabled) ||
      (statusFilter === "inactive" && user.isDisabled);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleToggleStatus = async (userId: string, isEnabled: boolean, userName: string) => {
    setConfirmDialog({
      open: true,
      userId,
      action: isEnabled ? "disable" : "enable",
      userName,
    });
  };

  const handlePlanChange = async (userId: string, newPlan: SubscriptionPlan, userName: string) => {
    setConfirmDialog({
      open: true,
      userId,
      action: "changePlan",
      newPlan,
      userName,
    });
  };

  const confirmAction = async () => {
    const { userId, action, newPlan } = confirmDialog;
    setIsUpdating(userId);

    try {
      if (action === "enable" || action === "disable") {
        const newStatus = action === "enable";

        await api.patch(`/admin/update-user-activity/${userId}`, { activity: newStatus });
        onUserUpdate(userId, { isDisabled: !newStatus });
        showToast(
          "success",
          `User ${action === "enable" ? "Enabled" : "Disabled"}`,
          `The user has been successfully ${action === "enable" ? "enabled" : "disabled"}.`,
        );
      } else if (action === "changePlan" && newPlan) {
        // API call to update user plan
        await api.patch(`/admin/update-user-plan/${userId}?plan=${newPlan}`);
        onUserUpdate(userId, { subscription: { plan: newPlan } });
        showToast(
          "success",
          "Plan Updated",
          `The user's plan has been changed to ${planConfig[newPlan].label}.`,
        );
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      showToast("error", "Update Failed", "Failed to update the user. Please try again.");
    } finally {
      setIsUpdating(null);
      setConfirmDialog({ open: false, userId: "", action: "enable" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="border-gray-100 overflow-hidden p-0">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                {/* User Info */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      <Image
                        width={200}
                        height={200}
                        src={user.avatar || "/default-avatar.png"}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Mail size={12} />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="py-4 px-6">
                  <Select
                    value={user?.subscription?.plan}
                    onValueChange={(value) =>
                      handlePlanChange(user._id, value as SubscriptionPlan, user.name)
                    }
                    disabled={isUpdating === user._id}
                  >
                    <SelectTrigger className={`w-36 h-8 border`}>
                      <SelectValue>
                        <div className="flex items-center gap-1.5">
                          {planConfig[user?.subscription?.plan]?.icon}
                          <span className="text-xs font-medium">
                            {planConfig[user?.subscription?.plan]?.label}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-gray-500" />
                          <span>Free</span>
                        </div>
                      </SelectItem>

                      <SelectItem value="pro">
                        <div className="flex items-center gap-2">
                          <Crown size={14} className="text-purple-500" />
                          <span>Professional</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!user.isDisabled}
                      onCheckedChange={() =>
                        handleToggleStatus(user._id, !user.isDisabled, user.name)
                      }
                      disabled={isUpdating === user._id}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        !user.isDisabled
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      {!user.isDisabled ? (
                        <span className="flex items-center gap-1">
                          <UserCheck size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserX size={12} />
                          Inactive
                        </span>
                      )}
                    </Badge>
                  </div>
                </td>

                {/* Joined Date */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={14} />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}{" "}
            users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 p-0 ${
                    pageNum === currentPage
                      ? "bg-gradient-to-r from-red-500 to-orange-500 border-none"
                      : ""
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "enable" && "Enable User"}
              {confirmDialog.action === "disable" && "Disable User"}
              {confirmDialog.action === "changePlan" && "Change User Plan"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "enable" &&
                `Are you sure you want to enable ${confirmDialog.userName}? They will be able to access their account again.`}
              {confirmDialog.action === "disable" &&
                `Are you sure you want to disable ${confirmDialog.userName}? They will not be able to log in until re-enabled.`}
              {confirmDialog.action === "changePlan" &&
                `Are you sure you want to change ${confirmDialog.userName}'s plan to ${
                  confirmDialog.newPlan ? planConfig[confirmDialog?.newPlan]?.label : ""
                }?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                confirmDialog.action === "disable"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
