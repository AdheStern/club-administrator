// src/components/system/user-activity/user-activity-container.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  UserActivityDTO,
  UserOption,
} from "@/lib/actions/types/user-activity-types";
import {
  getUserActivitiesByMonth,
  getUsers,
} from "@/lib/actions/user-activity-actions";
import { UserActivityCalendar } from "./user-activity-calendar";
import { UserActivityStats } from "./user-activity-stats";

export function UserActivityContainer() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [activities, setActivities] = useState<UserActivityDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.data) setUsers(res.data);
      setLoadingUsers(false);
    });
  }, []);

  const loadActivities = useCallback(
    async (userId: string, y: number, m: number) => {
      setLoadingActivities(true);
      const res = await getUserActivitiesByMonth(userId, y, m);
      if (res.success && res.data) setActivities(res.data);
      setLoadingActivities(false);
    },
    [],
  );

  useEffect(() => {
    if (!selectedUserId) return;
    loadActivities(selectedUserId, year, month);
  }, [selectedUserId, year, month, loadActivities]);

  function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Control de Actividad
        </h1>
        <p className="text-muted-foreground mt-1">
          Registra y visualiza la actividad diaria de usuarios
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="space-y-4 lg:w-80 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seleccionar usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {u.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedUserId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedUser?.name ?? "Usuario"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <UserActivityCalendar
                    userId={selectedUserId}
                    activities={activities}
                    onActivitiesChange={setActivities}
                    onMonthChange={handleMonthChange}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Estadísticas generales</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen de actividad de todos los usuarios
          </p>
        </div>
        <UserActivityStats />
      </div>
    </div>
  );
}
