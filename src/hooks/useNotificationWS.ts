import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import i18next from "i18next";
import {
  getGetUnreadCountQueryKey,
  getListNotificationsQueryKey,
} from "@/api/notifications/notifications";
import { notificationWS } from "@/lib/ws/notification-ws";
import { tokenStorage } from "@/lib/auth/token-storage";
import { useAuth } from "@/lib/auth/auth-context";

interface WSNotification {
  type: string;
  title?: string;
  message?: string;
  recipe_id?: number | null;
}

interface WSMessage {
  type: string;
  notification?: WSNotification;
}

/**
 * Build a localized toast from a WS notification payload.
 */
function showNotificationToast(notif: WSNotification): void {
  const t = i18next.t.bind(i18next);
  const recipeName = notif.title || "";

  // Map notification type → i18n heading key
  const heading = t(`notif_type_${notif.type}`, { defaultValue: "" });
  if (!heading) return; // Unknown notification type — skip toast

  // Map notification type → i18n body key (with recipe name interpolation)
  let body: string;
  const reason = notif.message || "";

  if (reason && i18next.exists(`notif_body_${notif.type}_reason`)) {
    body = t(`notif_body_${notif.type}_reason`, { title: recipeName, reason });
  } else {
    body = t(`notif_body_${notif.type}`, { defaultValue: "", title: recipeName });
  }

  // Pick toast variant based on notification type
  const type = notif.type;
  if (type.includes("approved")) {
    toast.success(heading, { description: body, duration: 5000 });
  } else if (type.includes("rejected") || type.includes("deleted")) {
    toast.error(heading, { description: body, duration: 5000 });
  } else {
    toast(heading, { description: body, duration: 5000 });
  }
}

/**
 * Connects to the notification WebSocket when authenticated.
 * Invalidates React Query caches on incoming notifications and shows a toast.
 * Should be mounted once at a high level (e.g. Header).
 */
export function useNotificationWS(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (connectedRef.current) {
        notificationWS.disconnect();
        connectedRef.current = false;
      }
      return;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    notificationWS.connect(token);
    connectedRef.current = true;

    const unsub = notificationWS.onMessage((data: unknown) => {
      // Invalidate caches
      queryClient.invalidateQueries({
        queryKey: getGetUnreadCountQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getListNotificationsQueryKey(),
      });

      // Show toast
      const msg = data as WSMessage;
      if (msg?.type === "new_notification" && msg.notification) {
        showNotificationToast(msg.notification);
      }
    });

    // Listen for auth:logout to disconnect
    const handleLogout = () => {
      notificationWS.disconnect();
      connectedRef.current = false;
    };
    window.addEventListener("auth:logout", handleLogout);

    return () => {
      unsub();
      window.removeEventListener("auth:logout", handleLogout);
      notificationWS.disconnect();
      connectedRef.current = false;
    };
  }, [isAuthenticated, queryClient]);
}
