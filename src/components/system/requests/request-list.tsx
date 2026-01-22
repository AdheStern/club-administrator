// src/components/system/requests/request-list.tsx
"use client";

import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import {
  ApproveDialog,
  ObserveDialog,
  PreApproveDialog,
  RejectDialog,
} from "./manager-action-dialog";
import { RequestCard } from "./request-card";
import { RequestDetailsDialog } from "./request-details-dialog";
import { RequestFormDrawer } from "./request-form-drawer";

interface RequestListProps {
  initialRequests: RequestWithRelations[];
  events: EventWithRelations[];
  packages: PackageWithRelations[];
  userId: string;
  userRole: string;
  onRefresh: () => void;
}

export function RequestList({
  initialRequests,
  events,
  packages,
  userId,
  userRole,
  onRefresh,
}: RequestListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPreApproveOpen, setIsPreApproveOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isObserveOpen, setIsObserveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const isManager = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  const canCreate = ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(
    userRole,
  );

  const visibleRequests = useMemo(() => {
    return initialRequests;
  }, [initialRequests]);

  const filteredRequests = useMemo(() => {
    return visibleRequests.filter((request) => {
      const matchesSearch =
        request.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.client.identityCard
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.event.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      const matchesEvent =
        eventFilter === "all" || request.eventId === eventFilter;

      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [visibleRequests, searchQuery, statusFilter, eventFilter]);

  const handleView = (request: RequestWithRelations) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleEdit = (request: RequestWithRelations) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  };

  const handleApprove = (request: RequestWithRelations) => {
    setSelectedRequest(request);
    if (request.status === "PRE_APPROVED") {
      setIsApproveOpen(true);
    } else {
      setIsPreApproveOpen(true);
    }
  };

  const handleObserve = (request: RequestWithRelations) => {
    setSelectedRequest(request);
    setIsObserveOpen(true);
  };

  const handleReject = (request: RequestWithRelations) => {
    setSelectedRequest(request);
    setIsRejectOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRequest(null);
  };

  const handleSuccess = () => {
    onRefresh();
  };

  const upcomingEvents = events.filter(
    (e) => e.isActive && new Date(e.eventDate) > new Date(),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Solicitudes</CardTitle>
              {!isManager && (
                <p className="text-sm text-muted-foreground mt-1">
                  Mostrando tus solicitudes
                </p>
              )}
            </div>
            {canCreate && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva solicitud
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, CI o evento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="OBSERVED">Observada</SelectItem>
                    <SelectItem value="PRE_APPROVED">Pre-Aprobada</SelectItem>
                    <SelectItem value="APPROVED">Aprobada</SelectItem>
                    <SelectItem value="REJECTED">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || eventFilter !== "all"
                  ? "No se encontraron solicitudes con los filtros aplicados"
                  : isManager
                    ? "No hay solicitudes creadas"
                    : "No has creado ninguna solicitud"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                eventFilter === "all" &&
                canCreate && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isManager
                      ? "Crear primera solicitud"
                      : "Crear mi primera solicitud"}
                  </Button>
                )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onView={handleView}
                  onEdit={handleEdit}
                  onApprove={handleApprove}
                  onObserve={handleObserve}
                  onReject={handleReject}
                  canEdit={request.createdById === userId || isManager}
                  canManage={isManager}
                  onRefresh={handleSuccess}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RequestFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        request={selectedRequest}
        events={upcomingEvents}
        packages={packages}
        userId={userId}
        userRole={userRole}
        onSuccess={() => {
          handleSuccess();
          handleFormClose();
        }}
      />

      <RequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
      />

      <PreApproveDialog
        open={isPreApproveOpen}
        onOpenChange={setIsPreApproveOpen}
        request={selectedRequest}
        userId={userId}
        onSuccess={handleSuccess}
      />

      <ApproveDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        request={selectedRequest}
        userId={userId}
        onSuccess={handleSuccess}
      />

      <ObserveDialog
        open={isObserveOpen}
        onOpenChange={setIsObserveOpen}
        request={selectedRequest}
        userId={userId}
        onSuccess={handleSuccess}
      />

      <RejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        request={selectedRequest}
        userId={userId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
