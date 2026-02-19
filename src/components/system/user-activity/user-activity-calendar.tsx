// src/components/system/user-activity/user-activity-calendar.tsx

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserActivityDTO } from "@/lib/actions/types/user-activity-types";
import { cn } from "@/lib/utils";
import { UserActivityDayDialog } from "./user-activity-day-dialog";

interface UserActivityCalendarProps {
  userId: string;
  activities: UserActivityDTO[];
  onActivitiesChange: (activities: UserActivityDTO[]) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export function UserActivityCalendar({
  userId,
  activities,
  onActivitiesChange,
  onMonthChange,
}: UserActivityCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activityMap = new Map(activities.map((a) => [a.date, a]));

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;

  function prevMonth() {
    const newYear = month === 1 ? year - 1 : year;
    const newMonth = month === 1 ? 12 : month - 1;
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  }

  function nextMonth() {
    const newYear = month === 12 ? year + 1 : year;
    const newMonth = month === 12 ? 1 : month + 1;
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  }

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setDialogOpen(true);
  }

  function handleSaved(activity: UserActivityDTO) {
    const updated = activities.filter((a) => a.date !== activity.date);
    onActivitiesChange([...updated, activity]);
  }

  function handleDeleted(date: string) {
    onActivitiesChange(activities.filter((a) => a.date !== date));
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium capitalize">{monthName}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}

          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const activity = activityMap.get(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square rounded-md text-sm flex items-center justify-center transition-colors hover:bg-accent relative",
                  isToday && "ring-2 ring-primary ring-offset-1",
                  activity?.hasActivity === true &&
                    "bg-green-500/20 text-green-700 dark:text-green-400 font-medium",
                  activity?.hasActivity === false &&
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                )}
              >
                {day}
                {activity?.description && (
                  <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-current opacity-60" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/30 inline-block" />
            Con actividad
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/15 inline-block" />
            Sin actividad
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-foreground inline-block" />
            Con nota
          </span>
        </div>
      </div>

      {selectedDate && (
        <UserActivityDayDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          date={selectedDate}
          existing={activityMap.get(selectedDate) ?? null}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
