// src/components/administration/organizations/organization-list.tsx

"use client";

import {
  Building,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteOrganization } from "@/lib/actions/organization-actions";
import { OrganizationFormDrawer } from "./organization-form-drawer";
import { OrganizationMembers } from "./organization-members";
import { OrganizationStatsCard } from "./organization-stats-card";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  _count: { members: number };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
}

interface OrganizationListProps {
  initialOrganizations: Organization[];
  currentUserId: string;
  onRefresh: () => void;
}

export function OrganizationList({
  initialOrganizations,
  currentUserId,
  onRefresh,
}: OrganizationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] =
    useState<Organization | null>(null);

  const filteredOrganizations = initialOrganizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalOrganizations: initialOrganizations.length,
    totalMembers: initialOrganizations.reduce(
      (sum, org) => sum + org._count.members,
      0
    ),
    pendingInvitations: 0,
  };

  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsFormOpen(true);
  };

  const handleDelete = (organization: Organization) => {
    setOrganizationToDelete(organization);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!organizationToDelete) return;

    const result = await deleteOrganization(organizationToDelete.id);

    if (result.success) {
      toast.success("Organización eliminada correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar organización");
    }

    setIsDeleteDialogOpen(false);
    setOrganizationToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedOrganization(null);
  };

  return (
    <>
      <div className="space-y-6">
        <OrganizationStatsCard
          totalOrganizations={stats.totalOrganizations}
          totalMembers={stats.totalMembers}
          pendingInvitations={stats.pendingInvitations}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Organizaciones</CardTitle>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva organización
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar organizaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={org.logo ?? undefined} alt={org.name} />
                      <AvatarFallback>
                        <Building className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{org.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {org.slug}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{org._count.members} miembros</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDetails(org)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(org)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(org)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredOrganizations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron organizaciones
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrganizationFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        organization={selectedOrganization}
        currentUserId={currentUserId}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={selectedOrganization?.logo ?? undefined}
                  alt={selectedOrganization?.name}
                />
                <AvatarFallback>
                  <Building className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {selectedOrganization?.name}
            </DialogTitle>
            <DialogDescription>
              Detalles y miembros de la organización
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Miembros</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {selectedOrganization && (
                <OrganizationMembers
                  organizationId={selectedOrganization.id}
                  members={selectedOrganization.members as never}
                  onRefresh={onRefresh}
                />
              )}
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrganization?.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrganization?.slug}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Total de miembros
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrganization?._count.members}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar organización?"
        description={`¿Estás seguro de que deseas eliminar ${organizationToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
