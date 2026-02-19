// src/lib/actions/types/user-activity-types.ts

import type { User, UserActivity } from "@prisma/client";

export interface UserActivityDTO {
  id: string;
  userId: string;
  date: string;
  hasActivity: boolean;
  description: string | null;
}

export interface UpsertUserActivityDTO {
  userId: string;
  date: string;
  hasActivity: boolean;
  description?: string;
}

export type UserOption = Pick<User, "id" | "name" | "email" | "role">;

export type UserActivityWithUser = UserActivity & {
  user: UserOption;
};

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserActivityRankItem {
  userId: string;
  userName: string;
  activityCount: number;
}

export interface MonthlyActivityItem {
  month: string;
  label: string;
  activityCount: number;
}

export interface WeekdayActivityItem {
  weekday: number;
  label: string;
  activityCount: number;
}

export interface ActivityStatsDTO {
  topUsers: UserActivityRankItem[];
  bottomUsers: UserActivityRankItem[];
  byMonth: MonthlyActivityItem[];
  byWeekday: WeekdayActivityItem[];
}
