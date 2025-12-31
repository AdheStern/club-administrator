// src/components/users/users-dashboard.tsx

import { UsersTable } from "./users-table";

export function UsersDashboard() {
  return (
    <div className="flex flex-col gap-4 relative">
      <h2 className="text-xl text-primary font-bold">Usuarios</h2>
      <UsersTable />
    </div>
  );
}
