// src/components/administration/organizations/organization-members.tsx

"use client";

import { OrgRole } from "@prisma/client";
import { Loader2, MoreHorizontal, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { RoleBadge } from "@/components/administration/shared/role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/actions/organization-actions";

interface Member {
  id: string;
  role: OrgRole;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface OrganizationMembersProps {
  organizationId: string;
  members: Member[];
  onRefresh: () => void;
}

export function OrganizationMembers({
  organizationId,
  members,
  onRefresh,
}: OrganizationMembersProps) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<Member | null>(
    null
  );
  const [newRole, setNewRole] = useState<OrgRole | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveMember = (member: Member) => {
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  const handleChangeRole = (member: Member) => {
    setMemberToChangeRole(member);
    setNewRole(member.role);
    setIsRoleDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    setIsLoading(true);
    const result = await removeOrganizationMember(
      organizationId,
      memberToRemove.user.id
    );

    if (result.success) {
      toast.success("Miembro eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar miembro");
    }

    setIsLoading(false);
    setIsRemoveDialogOpen(false);
    setMemberToRemove(null);
  };

  const confirmRoleChange = async () => {
    if (!memberToChangeRole || !newRole) return;

    setIsLoading(true);
    const result = await updateOrganizationMemberRole(
      organizationId,
      memberToChangeRole.user.id,
      newRole
    );

    if (result.success) {
      toast.success("Rol actualizado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al actualizar rol");
    }

    setIsLoading(false);
    setIsRoleDialogOpen(false);
    setMemberToChangeRole(null);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay miembros en esta organización
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => {
          const initials = member.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.name}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RoleBadge role={member.role} />

                {member.role !== OrgRole.OWNER && (
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
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member)}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Cambiar rol
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        onConfirm={confirmRemove}
        title="¿Remover miembro?"
        description={`¿Estás seguro de que deseas remover a ${memberToRemove?.user.name} de esta organización?`}
        confirmText="Remover"
        variant="destructive"
      />

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {memberToChangeRole?.user.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={newRole ?? undefined}
              onValueChange={(value) => setNewRole(value as OrgRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrgRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={OrgRole.MEMBER}>Miembro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={isLoading || !newRole}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
