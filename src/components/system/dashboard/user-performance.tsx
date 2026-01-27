// src/components/system/dashboard/user-performance.tsx
import { TrendingUp, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserPerformance as UserPerformanceType } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface UserPerformanceProps {
  data: UserPerformanceType[];
}

export function UserPerformance({ data }: UserPerformanceProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getResponseTimeColor = (hours: number) => {
    if (hours <= 12) return "text-green-600";
    if (hours <= 24) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Rendimiento de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <div
                    className={cn(
                      "absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-yellow-500 text-white",
                      index === 1 && "bg-gray-400 text-white",
                      index === 2 && "bg-orange-600 text-white",
                    )}
                  >
                    {index + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{user.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.requestsCreated} solicitudes procesadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {user.approvalRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">aprobación</p>
                  </div>
                </div>

                <Progress value={user.approvalRate} className="h-2" />

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {user.requestsApproved} aprobadas
                    </Badge>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        getResponseTimeColor(user.avgResponseTime),
                      )}
                    >
                      ⏱️ {user.avgResponseTime.toFixed(1)}h promedio
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay datos de rendimiento</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
