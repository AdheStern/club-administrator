"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.error(error.message || "Error al cerrar sesión");
        return;
      }

      toast.success("Sesión cerrada correctamente");
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full"
    >
      <LogOutIcon className="mr-2 h-4 w-4" />
      {isLoading ? "Cerrando..." : "Cerrar Sesión"}
    </Button>
  );
}
