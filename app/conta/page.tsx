import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatCpf } from "@/lib/utils";
import { ChangePasswordForm } from "./change-password-form";

export default async function ContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Minha Conta</h1>
      <p className="mt-1 text-sm text-slate-500">
        {session.nome} · CPF {formatCpf(session.cpf)}
      </p>

      <div className="mt-6 max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Alterar senha</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
