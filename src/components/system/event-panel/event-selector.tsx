// src/components/system/event-panel/event-selector.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventOptionDTO } from "@/lib/actions/types/event-panel-types";

interface EventSelectorProps {
  events: EventOptionDTO[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
}

export function EventSelector({
  events,
  selectedEventId,
  onSelect,
}: EventSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedEventId ?? ""} onValueChange={onSelect}>
        <SelectTrigger className="w-[280px] h-8 text-sm">
          <SelectValue placeholder="Seleccionar evento..." />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              <div className="flex items-center gap-2">
                <span>{event.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.eventDate), "dd MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
