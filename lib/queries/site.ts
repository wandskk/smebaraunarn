import { prisma } from "@/lib/prisma";

export async function getIndicadores() {
  const indicadores = await prisma.indicadoresLanding.findUnique({ where: { id: "default" } });
  return (
    indicadores ?? {
      id: "default",
      totalEscolas: 20,
      totalAlunos: 3800,
      totalDocumentos: 150,
      totalAcessos: 12500,
      updatedAt: new Date(),
    }
  );
}

export async function getPostsDestaque(limit = 3) {
  return prisma.post.findMany({
    where: { publicado: true, destaque: true },
    orderBy: { dataPublicacao: "desc" },
    take: limit,
  });
}

export async function getPostsRecentes(limit = 6) {
  return prisma.post.findMany({
    where: { publicado: true },
    orderBy: { dataPublicacao: "desc" },
    take: limit,
  });
}

export async function getAvisosImportantes(limit = 5) {
  return prisma.post.findMany({
    where: { publicado: true, importante: true },
    orderBy: { dataPublicacao: "desc" },
    take: limit,
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({ where: { slug, publicado: true } });
}

export async function getDocumentosPublicos(limit = 8) {
  return prisma.documentoPublico.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface PostListFilters {
  categoria?: "NOTICIA" | "AVISO" | "DESTAQUE" | "DOCUMENTO";
  page?: number;
  pageSize?: number;
}

export async function listPosts({ categoria, page = 1, pageSize = 9 }: PostListFilters) {
  const where = { publicado: true, ...(categoria ? { categoria } : {}) };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { dataPublicacao: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
