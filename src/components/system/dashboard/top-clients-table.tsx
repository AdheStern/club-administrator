// src/components/system/dashboard/top-clients-table.tsx

import { Award, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Top Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-center">Solicitudes</TableHead>
              <TableHead className="text-center">Eventos</TableHead>
              <TableHead className="text-center">Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((client, index) => (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div
                          className={cn(
                            "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
                            index === 0 && "bg-yellow-500 text-white",
                            index === 1 && "bg-gray-400 text-white",
                            index === 2 && "bg-orange-600 text-white",
                          )}
                        >
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        CI: {client.identityCard}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-mono">
                    {client.requestCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{client.eventsAttended}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {client.loyaltyPoints} pts
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No hay datos de clientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
