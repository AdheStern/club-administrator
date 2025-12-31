// src/components/auth/sign-out-button.tsx

"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();

    // Redirecciona a la página de inicio después de cerrar sesión
    router.push("/");
  };

  return (
    <Button variant={"outline"} onClick={handleSignOut} className="w-full">
      <LogOutIcon className="mr-2 h-4 w-4" />
      Cerrar Sesión
    </Button>
  );
}
