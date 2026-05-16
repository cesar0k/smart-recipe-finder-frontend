import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  listNotifications,
} from "@/api/notifications/notifications";
import type { NotificationResponse } from "@/api/model";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRelativeTime } from "@/hooks/useRelativeTime";

/**
 * Map notification `type` to a navigation path.
 */
function useNotificationLink() {
  const { user } = useAuth();
  const profilePath = user ? `/user/${user.id}` : "/";

  return (n: NotificationResponse): string | null => {
    switch (n.type) {
      case "new_pending_recipe":
        return "/moderation";
      case "recipe_approved":
      case "draft_approved":
      case "draft_rejected":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : null;
      case "recipe_rejected":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : profilePath;
      case "recipe_deleted":
        return profilePath;
      case "new_comment":
      case "comment_reply":
        if (n.recipe_id && n.comment_id) {
          return `/recipe/${n.recipe_id}#comment-${n.comment_id}`;
        }
        return n.recipe_id ? `/recipe/${n.recipe_id}#comments` : null;
      case "comment_reported":
        return "/moderation?tab=comments";
      case "followed_user_published":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : null;
      case "user_followed":
        return null;
      default:
        return null;
    }
  };
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
      case "new_comment":
        return {
          heading: t("notif_type_new_comment"),
          body: t("notif_body_new_comment", { title: recipeName }),
        };
      case "comment_reply":
        return {
          heading: t("notif_type_comment_reply"),
          body: t("notif_body_comment_reply", { title: recipeName }),
        };
      case "comment_reported":
        return {
          heading: t("notif_type_comment_reported"),
          body: t("notif_body_comment_reported", { title: recipeName }),
        };
      case "user_followed":
        return {
          heading: t("notif_type_user_followed"),
          body: t("notif_body_user_followed", { username: n.message }),
        };
      case "followed_user_published":
        return {
          heading: t("notif_type_followed_user_published"),
          body: t("notif_body_followed_user_published", { author: n.message, title: recipeName }),
        };
      default:
        return { heading: n.type, body: recipeName };
    }
  };
}

const PAGE_SIZE = 20;

export function NotificationPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getNotifText = useNotificationText();
  const getNotificationLink = useNotificationLink();
  const formatRelativeTime = useRelativeTime();
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useGetUnreadCount();

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: getListNotificationsQueryKey({ limit: PAGE_SIZE }),
    queryFn: ({ pageParam = 0 }) =>
      listNotifications({ skip: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
  });

  const notifications: NotificationResponse[] = infiniteData?.pages.flat() ?? [];

  // Sentinel for infinite scroll inside the dropdown
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
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
          {notifications.map((n: NotificationResponse) => {
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
          {/* Infinite scroll sentinel */}
          <div ref={sentinelCallbackRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Footer — sticky bottom, always visible */}
        {notifications && notifications.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-2 flex justify-center shrink-0 bg-white rounded-b-2xl">
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
