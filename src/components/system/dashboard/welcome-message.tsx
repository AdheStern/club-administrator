// src/components/system/dashboard/welcome-message.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WelcomeMessageProps {
  userName: string;
  userRole: string;
}

export function WelcomeMessage({ userName, userRole }: WelcomeMessageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hola, {userName}</CardTitle>
        <CardDescription>
          Bienvenido al sistema de gestión de eventos y reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tu rol actual:{" "}
          <span className="font-medium text-foreground">{userRole}</span>
        </p>
        <p className="text-sm">
          Utiliza el menú de navegación para acceder a las funciones disponibles
          según tus permisos.
        </p>
      </CardContent>
    </Card>
  );
}
