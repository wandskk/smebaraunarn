import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { Indicators } from "@/components/site/indicators";
import { NewsSection } from "@/components/site/news-section";
import { DocumentsSection } from "@/components/site/documents-section";
import { getDocumentosPublicos, getIndicadores, getPostsRecentes } from "@/lib/queries/site";

export default async function HomePage() {
  const [indicadores, posts, documentos] = await Promise.all([
    getIndicadores(),
    getPostsRecentes(6),
    getDocumentosPublicos(4),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Indicators indicadores={indicadores} />
        <NewsSection posts={posts} />
        <DocumentsSection documentos={documentos} />

        <section id="sobre" className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">A Secretaria Municipal de Educação</h2>
              <p className="mt-4 text-slate-600">
                A SME Baraúna é responsável pela gestão da rede pública municipal de ensino,
                atuando na Educação Infantil e no Ensino Fundamental. Nosso trabalho é orientado
                por dados, acompanhamento pedagógico contínuo e integração com o SIGEduc para
                garantir transparência e eficiência na gestão escolar.
              </p>
              <p className="mt-4 text-slate-600">
                Este portal reúne, em um só lugar, informações institucionais, documentos
                oficiais e o acesso ao sistema de gestão para servidores, professores, alunos e
                responsáveis.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { titulo: "Gestão Pedagógica", texto: "Acompanhamento de notas, frequência e avaliações municipais." },
                { titulo: "Avaliações Municipais", texto: "Fluência Leitora, SPADEB e simulados aplicados na rede." },
                { titulo: "Transparência", texto: "Documentos, portarias e editais publicados publicamente." },
                { titulo: "Integração SIGEduc", texto: "Dados sincronizados diretamente com o sistema Educ 21." },
              ].map((card) => (
                <div key={card.titulo} className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-1 text-sm font-semibold text-slate-900">{card.titulo}</h3>
                  <p className="text-xs text-slate-500">{card.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
