import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, ShieldCheck, Trash2, Ban, CheckCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BackButton } from "@/components/BackButton";
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
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHeaderSlots } from "@/hooks/useHeaderSlots";

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
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_admin"));
  useHeaderSlots({ left: <BackButton /> }, []);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();

  // Client-side search across name, email, ID, role and display name.
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(() => {
    if (!users) return users;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u: UserResponse) =>
      [
        u.username,
        u.email,
        u.display_name ?? "",
        u.role,
        String(u.id),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [users, search]);
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  // Latched copy keeps username/email rendered through the AlertDialog exit
  // animation (Radix unmounts after the animation; deleteTarget is cleared
  // synchronously on close). Same pattern as DeleteRecipeDialog.
  const [latchedDelete, setLatchedDelete] = useState<UserResponse | null>(null);
  // Update the latch during render (on the transition to a non-null target)
  // instead of from a useEffect — same trick as DeleteRecipeDialog.
  if (deleteTarget && deleteTarget !== latchedDelete) {
    setLatchedDelete(deleteTarget);
  }
  const displayedDelete = deleteTarget ?? latchedDelete;

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
      setDeleteTarget(null);
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }),
        200,
      );
    } catch {
      toast.error(t("admin_error"));
      setDeleteTarget(null);
    }
  };

  const isBusy = isUpdating || isDeleting;

  return (
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("admin_title")}
        </h1>

        {/* Search */}
        {!isLoading && users && users.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin_search_placeholder")}
              className="pl-9 pr-9 rounded-full h-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t("cancel_btn")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

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

        {/* No results for the current search query */}
        {!isLoading &&
          users &&
          users.length > 0 &&
          filteredUsers &&
          filteredUsers.length === 0 && (
            <p className="text-gray-500 text-center py-10">
              {t("admin_no_search_results", { query: search.trim() })}
            </p>
          )}

        {filteredUsers && filteredUsers.length > 0 && (
          <div className="space-y-3">
            {filteredUsers.map((u: UserResponse) => {
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
                      <Link
                        to={`/user/${u.id}`}
                        className="font-semibold text-gray-900 hover:underline truncate"
                      >
                        {u.username}
                      </Link>
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

                  {/* Actions — hidden for self and admin accounts */}
                  {!isSelf && u.role !== "admin" && (
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
                username: displayedDelete?.username,
                email: displayedDelete?.email,
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
