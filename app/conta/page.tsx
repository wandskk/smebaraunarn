import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatCpf } from "@/lib/utils";
import { ChangePasswordForm } from "./change-password-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";

export default async function ContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <PageHeader title="Minha Conta" description={`${session.nome} · CPF ${formatCpf(session.cpf)}`} />

      <SectionCard title="Alterar senha" className="mt-6 max-w-sm">
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}
