import { requireSession } from "@/lib/require-session";
import { AppShell } from "@/components/admin/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN", "SECRETARIA"]);

  return <AppShell session={session}>{children}</AppShell>;
}
