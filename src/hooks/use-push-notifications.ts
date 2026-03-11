// src/hooks/use-push-notifications.ts

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/actions/push-subscription-actions";

interface UsePushNotificationsProps {
  userId: string;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications({
  userId,
}: UsePushNotificationsProps): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (!supported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        registrationRef.current = reg;
        const existing = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existing);
      })
      .catch(() => {
        setIsSupported(false);
      });
  }, []);

  const subscribe = async (): Promise<void> => {
    const registration = registrationRef.current;
    if (!registration || !isSupported) return;

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        toast.error("Permiso de notificaciones denegado");
        return;
      }

      if (permission !== "granted") return;

      const existing = await registration.pushManager.getSubscription();

      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        }));

      const json = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      if (!json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Error al obtener claves de suscripción");
        return;
      }

      const result = await subscribeToPush({
        userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });

      if (!result.success) {
        toast.error(result.error ?? "Error al guardar suscripción");
        return;
      }

      setIsSubscribed(true);
      toast.success("Notificaciones activadas");
    } catch (error) {
      toast.error("No se pudo activar las notificaciones");
      console.error("[push:subscribe]", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    const registration = registrationRef.current;
    if (!registration) return;

    setIsLoading(true);

    try {
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const result = await unsubscribeFromPush(subscription.endpoint);

        if (!result.success) {
          toast.error(result.error ?? "Error al desactivar suscripción");
          return;
        }

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Notificaciones desactivadas");
    } catch (error) {
      toast.error("No se pudo desactivar las notificaciones");
      console.error("[push:unsubscribe]", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
