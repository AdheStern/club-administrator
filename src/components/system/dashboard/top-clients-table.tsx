// src/components/system/dashboard/top-clients-table.tsx
"use client";

import { Award, DollarSign, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TopClient } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface TopClientsTableProps {
  data: TopClient[];
}

export function TopClientsTable({ data }: TopClientsTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span className="text-sm">Top Clientes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {data.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(client.name)}
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

                <div className="flex-1 min-w-0 space-y-1">
                  <div>
                    <p className="font-semibold truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      CI: {client.identityCard}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {client.requestCount} solicitudes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {client.loyaltyPoints} pts
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1 text-green-600">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-sm font-semibold">
                        {formatCurrency(client.totalSpent)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-muted-foreground">
                        {client.eventsAttended} eventos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-16 w-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No hay datos de clientes</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
