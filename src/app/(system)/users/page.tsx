// src/app/(system)/users/page.tsx

import { UsersDashboard } from "@/components/users/users-dashboard";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4 relative">
      <UsersDashboard />
    </div>
  );
}
