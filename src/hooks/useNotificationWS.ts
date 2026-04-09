import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetUnreadCountQueryKey,
  getListNotificationsQueryKey,
} from "@/api/notifications/notifications";
import { notificationWS } from "@/lib/ws/notification-ws";
import { tokenStorage } from "@/lib/auth/token-storage";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Connects to the notification WebSocket when authenticated.
 * Invalidates React Query caches on incoming notifications.
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

    const unsub = notificationWS.onMessage(() => {
      // Any WS message means new data — invalidate caches
      queryClient.invalidateQueries({
        queryKey: getGetUnreadCountQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getListNotificationsQueryKey(),
      });
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
