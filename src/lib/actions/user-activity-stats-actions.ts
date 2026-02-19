// src/lib/actions/user-activity-stats-actions.ts

"use server";

import type {
  ActionResult,
  ActivityStatsDTO,
  MonthlyActivityItem,
  UserActivityRankItem,
  WeekdayActivityItem,
} from "@/lib/actions/types/user-activity-types";
import { db } from "@/lib/db";

const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export async function getActivityStats(): Promise<
  ActionResult<ActivityStatsDTO>
> {
  try {
    const [rankData, allActivities] = await Promise.all([
      db.userActivity.groupBy({
        by: ["userId"],
        where: { hasActivity: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.userActivity.findMany({
        where: { hasActivity: true },
        select: { date: true },
      }),
    ]);

    const userIds = rankData.map((r) => r.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const ranked: UserActivityRankItem[] = rankData.map((r) => ({
      userId: r.userId,
      userName: userMap.get(r.userId) ?? "Sin nombre",
      activityCount: r._count.id,
    }));

    const topUsers = ranked.slice(0, 5);
    const bottomUsers = [...ranked].reverse().slice(0, 5);

    const monthMap = new Map<string, number>();
    const weekdayMap = new Map<number, number>();

    for (const { date } of allActivities) {
      const d = new Date(date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1);
      const wd = d.getDay();
      weekdayMap.set(wd, (weekdayMap.get(wd) ?? 0) + 1);
    }

    const byMonth: MonthlyActivityItem[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, activityCount]) => {
        const [y, m] = month.split("-");
        return {
          month,
          label: `${MONTH_LABELS[parseInt(m) - 1]} ${y}`,
          activityCount,
        };
      });

    const byWeekday: WeekdayActivityItem[] = Array.from(
      { length: 7 },
      (_, i) => ({
        weekday: i,
        label: WEEKDAY_LABELS[i],
        activityCount: weekdayMap.get(i) ?? 0,
      }),
    );

    return {
      success: true,
      data: { topUsers, bottomUsers, byMonth, byWeekday },
    };
  } catch {
    return { success: false, error: "Error al obtener estadísticas" };
  }
}
