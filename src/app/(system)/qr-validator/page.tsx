import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QRValidatorContainer } from "@/components/system/qr/qr-validator-container";
import { auth } from "@/lib/auth";

export default async function QRValidatorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <QRValidatorContainer
      userId={session.user.id}
      userRole={session.user.role || "USER"}
    />
  );
}
