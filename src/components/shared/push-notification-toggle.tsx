// src/components/shared/push-notification-toggle.tsx

"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface PushNotificationToggleProps {
  userId: string;
}

export function PushNotificationToggle({
  userId,
}: PushNotificationToggleProps) {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications({ userId });

  if (!isSupported) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSubscribed
            ? "Notificaciones activadas — clic para desactivar"
            : "Activar notificaciones"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
