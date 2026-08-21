import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { UserForm } from "./user-form";
import { ToggleAtivoButton } from "./toggle-ativo-button";
import { ResetPasswordButton } from "./reset-password-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { cpf: { contains: q } }] }
    : undefined;

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.user.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Usuários e Acessos"
        description={`Contas provisionadas automaticamente no primeiro login (CPF + data de nascimento) e acessos manuais criados pela administração. ${total} usuário(s).`}
      />

      <SectionCard title="Criar acesso manual" className="mt-6">
        <UserForm />
      </SectionCard>

      <ListToolbar searchPlaceholder="Buscar por nome ou CPF..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>CPF</TableHeadCell>
              <TableHeadCell>Papel</TableHeadCell>
              <TableHeadCell>Criado em</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Vínculo</TableHeadCell>
              <TableHeadCell>Senha</TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.nome}</TableCell>
                <TableCell className="text-foreground-muted">{formatCpf(u.cpf)}</TableCell>
                <TableCell className="text-foreground-muted">{u.role}</TableCell>
                <TableCell className="text-foreground-muted">{u.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <ToggleAtivoButton userId={u.id} ativo={u.ativo} />
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {u.servidorId ? "Servidor" : u.estudanteId ? "Estudante" : "—"}
                </TableCell>
                <TableCell>
                  <ResetPasswordButton userId={u.id} temOrigem={Boolean(u.servidorId || u.estudanteId)} />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {usuarios.length === 0 && <TableEmptyState colSpan={8} title="Nenhum usuário encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/usuarios"
        searchParams={searchParams}
      />
    </div>
  );
}
