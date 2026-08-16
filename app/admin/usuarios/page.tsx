import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import { UserForm } from "./user-form";
import { ToggleAtivoButton } from "./toggle-ativo-button";
import { ResetPasswordButton } from "./reset-password-button";

export default async function AdminUsuariosPage() {
  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Usuários e Acessos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Contas provisionadas automaticamente no primeiro login (CPF + data de nascimento) e acessos
        manuais criados pela administração.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Criar acesso manual</h2>
        <UserForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vínculo</th>
              <th className="px-4 py-3">Senha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.nome}</td>
                <td className="px-4 py-3 text-slate-500">{formatCpf(u.cpf)}</td>
                <td className="px-4 py-3 text-slate-500">{u.role}</td>
                <td className="px-4 py-3 text-slate-500">{u.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <ToggleAtivoButton userId={u.id} ativo={u.ativo} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.servidorId ? "Servidor" : u.estudanteId ? "Estudante" : "—"}
                </td>
                <td className="px-4 py-3">
                  <ResetPasswordButton userId={u.id} temOrigem={Boolean(u.servidorId || u.estudanteId)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-brand-700 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
