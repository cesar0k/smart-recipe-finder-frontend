import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, ShieldCheck, Trash2, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/spinner";

import {
  useListUsers,
  getListUsersQueryKey,
  useUpdateUser,
  useDeleteUser,
} from "@/api/users/users";
import type { UserResponse } from "@/api/model";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "react-i18next";

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  moderator: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="w-3.5 h-3.5" />,
  moderator: <Shield className="w-3.5 h-3.5" />,
};

export function AdminPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUser({ userId, data: { role: newRole } });
      toast.success(t("admin_role_updated"));
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch {
      toast.error(t("admin_error"));
    }
  };

  const handleToggleActive = async (user: UserResponse) => {
    try {
      await updateUser({
        userId: user.id,
        data: { is_active: !user.is_active },
      });
      toast.success(
        user.is_active ? t("admin_user_deactivated") : t("admin_user_activated")
      );
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch {
      toast.error(t("admin_error"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser({ userId: deleteTarget.id });
      toast.success(t("admin_user_deleted"));
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch {
      toast.error(t("admin_error"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const isBusy = isUpdating || isDeleting;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        leftContent={
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">{t("back_btn")}</span>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("admin_title")}
        </h1>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-gray-300" />
          </div>
        )}

        {!isLoading && (!users || users.length === 0) && (
          <p className="text-gray-500 text-center py-10">
            {t("admin_no_users")}
          </p>
        )}

        {users && users.length > 0 && (
          <div className="space-y-3">
            {users.map((u: UserResponse) => {
              const isSelf = u.id === currentUser?.id;

              return (
                <div
                  key={u.id}
                  className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                    !u.is_active
                      ? "border-red-100 bg-red-50/30"
                      : "border-gray-100"
                  }`}
                >
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {u.username}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${ROLE_BADGE_COLORS[u.role] || ROLE_BADGE_COLORS.user}`}
                      >
                        {ROLE_ICONS[u.role]}
                        {u.role}
                      </Badge>
                      {!u.is_active && (
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-600 border-red-200">
                          {t("admin_inactive")}
                        </Badge>
                      )}
                      {isSelf && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                          {t("admin_you")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    <p className="text-xs text-gray-400">
                      ID: {u.id} · {t("admin_joined")}{" "}
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role selector */}
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.id, val)}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="w-[130px] rounded-full h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="user" className="rounded-xl">
                            user
                          </SelectItem>
                          <SelectItem value="moderator" className="rounded-xl">
                            moderator
                          </SelectItem>
                          <SelectItem value="admin" className="rounded-xl">
                            admin
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Toggle active */}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-full gap-1 ${
                          u.is_active
                            ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                            : "text-green-600 border-green-200 hover:bg-green-50"
                        }`}
                        onClick={() => handleToggleActive(u)}
                        disabled={isBusy}
                        title={
                          u.is_active
                            ? t("admin_deactivate")
                            : t("admin_activate")
                        }
                      >
                        {u.is_active ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(u)}
                        disabled={isBusy}
                        title={t("admin_delete_user")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin_delete_desc", {
                username: deleteTarget?.username,
                email: deleteTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
              disabled={isBusy}
            >
              {t("admin_delete_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
