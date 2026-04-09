import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetUnreadCount,
  getGetUnreadCountQueryKey,
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/api/notifications/notifications";
import type { NotificationResponse } from "@/api/model";
import { useState } from "react";

/**
 * Map notification `type` to a navigation path.
 */
function getNotificationLink(n: NotificationResponse): string | null {
  switch (n.type) {
    case "new_pending_recipe":
      return "/moderation";
    case "recipe_approved":
    case "draft_approved":
    case "draft_rejected":
      return n.recipe_id ? `/recipe/${n.recipe_id}` : null;
    case "recipe_rejected":
      return n.recipe_id ? `/recipe/${n.recipe_id}` : "/my-recipes";
    case "recipe_deleted":
      return "/my-recipes";
    default:
      return null;
  }
}

/**
 * Build a localized notification title based on `type` field.
 * `n.title` now contains the recipe name from the backend.
 */
function useNotificationText() {
  const { t } = useTranslation();

  return (n: NotificationResponse) => {
    const recipeName = n.title || "";
    switch (n.type) {
      case "new_pending_recipe":
        return {
          heading: t("notif_type_new_pending"),
          body: t("notif_body_new_pending", { title: recipeName }),
        };
      case "recipe_approved":
        return {
          heading: t("notif_type_recipe_approved"),
          body: t("notif_body_recipe_approved", { title: recipeName }),
        };
      case "recipe_rejected":
        return {
          heading: t("notif_type_recipe_rejected"),
          body: n.message
            ? t("notif_body_recipe_rejected_reason", {
                title: recipeName,
                reason: n.message,
              })
            : t("notif_body_recipe_rejected", { title: recipeName }),
        };
      case "draft_approved":
        return {
          heading: t("notif_type_draft_approved"),
          body: t("notif_body_draft_approved", { title: recipeName }),
        };
      case "draft_rejected":
        return {
          heading: t("notif_type_draft_rejected"),
          body: n.message
            ? t("notif_body_draft_rejected_reason", {
                title: recipeName,
                reason: n.message,
              })
            : t("notif_body_draft_rejected", { title: recipeName }),
        };
      case "recipe_deleted":
        return {
          heading: t("notif_type_recipe_deleted"),
          body: t("notif_body_recipe_deleted", { title: recipeName }),
        };
      default:
        return { heading: n.type, body: recipeName };
    }
  };
}

/**
 * Localized relative time using Intl.RelativeTimeFormat.
 */
function useRelativeTime() {
  const { i18n } = useTranslation();

  return (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });

    if (diffSec < 60) return rtf.format(-diffSec, "second");
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return rtf.format(-diffMin, "minute");
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return rtf.format(-diffDays, "day");
    const diffMonths = Math.floor(diffDays / 30);
    return rtf.format(-diffMonths, "month");
  };
}

export function NotificationPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getNotifText = useNotificationText();
  const formatRelativeTime = useRelativeTime();
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useGetUnreadCount();
  const { data: notifications } = useListNotifications({ skip: 0, limit: 20 });
  const { mutateAsync: markRead } = useMarkNotificationRead();
  const { mutateAsync: markAllRead } = useMarkAllNotificationsRead();
  const { mutateAsync: deleteOne } = useDeleteNotification();
  const { mutateAsync: deleteAll } = useDeleteAllNotifications();

  const unreadCount = unreadData?.count ?? 0;

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: getGetUnreadCountQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getListNotificationsQueryKey(),
    });
  };

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await markRead({ notificationId: id });
    invalidateAll();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    invalidateAll();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOne({ notificationId: id });
    invalidateAll();
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    invalidateAll();
  };

  const handleClick = (n: NotificationResponse) => {
    const link = getNotificationLink(n);
    if (link) {
      setOpen(false);
      if (!n.is_read) {
        markRead({ notificationId: n.id }).then(invalidateAll);
      }
      navigate(link);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-0 flex flex-col"
      >
        {/* Header — sticky top */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="font-semibold text-sm text-gray-900">
            {t("notifications_title")}
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-gray-500 hover:text-gray-900 gap-1 rounded-full px-2"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t("notifications_mark_all_read_short")}
            </Button>
          )}
        </div>

        {/* Scrollable list */}
        <div className="max-h-80 overflow-y-auto min-h-0 flex-1">
          {(!notifications || notifications.length === 0) && (
            <div className="flex items-center justify-center py-8 px-4">
              <p className="text-sm text-gray-400">
                {t("notifications_empty")}
              </p>
            </div>
          )}
          {notifications?.map((n: NotificationResponse) => {
            const { heading, body } = getNotifText(n);
            const link = getNotificationLink(n);

            return (
              <div
                key={n.id}
                {...(link ? { role: "button", tabIndex: 0 } : {})}
                className={`px-4 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors ${
                  !n.is_read ? "bg-blue-50/50" : ""
                } ${link ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={() => handleClick(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleClick(n);
                }}
              >
                {/* Unread indicator dot — always takes 2px width */}
                <div className="w-2 shrink-0 flex justify-center">
                  {!n.is_read ? (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-2 h-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {heading}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {body}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>

                {/* Actions — ALWAYS same width to prevent layout shift */}
                <div className="flex items-center gap-0.5 shrink-0 w-[60px] justify-end">
                  {!n.is_read ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-gray-400 hover:text-green-600"
                      onClick={(e) => handleMarkRead(n.id, e)}
                      title={t("notifications_mark_read")}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <div className="h-7 w-7" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-gray-300 hover:text-red-500"
                    onClick={(e) => handleDelete(n.id, e)}
                    title={t("notifications_delete_one")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — sticky bottom, always visible */}
        {notifications && notifications.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 flex justify-center shrink-0 bg-white rounded-b-2xl">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-gray-400 hover:text-red-600 gap-1 rounded-full px-2"
              onClick={handleDeleteAll}
            >
              <Trash2 className="w-3 h-3" />
              {t("notifications_clear_all")}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
