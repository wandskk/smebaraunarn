import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="contato" className="border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-white">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">SME Baraúna</span>
          </div>
          <p className="text-sm text-slate-400">
            Secretaria Municipal de Educação de Baraúna - RN. Compromisso com uma educação pública
            de qualidade para todos os estudantes do município.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Links Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/noticias" className="hover:text-white">Notícias</Link></li>
            <li><Link href="/documentos" className="hover:text-white">Documentos e Editais</Link></li>
            <li><Link href="/login" className="hover:text-white">Área Restrita (SIGEduc)</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Institucional</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#sobre" className="hover:text-white">A Secretaria</Link></li>
            <li><Link href="/documentos" className="hover:text-white">Portarias e Resoluções</Link></li>
            <li><Link href="/documentos" className="hover:text-white">Calendário Escolar</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Contato</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Centro Administrativo Municipal, Baraúna - RN</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>(84) 0000-0000</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span>educacao@barauna.rn.gov.br</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Secretaria Municipal de Educação de Baraúna - RN. Todos os
        direitos reservados.
      </div>
    </footer>
  );
}
