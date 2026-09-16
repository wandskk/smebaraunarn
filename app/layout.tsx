import type { Metadata } from "next";
import "./globals.css";
import { NavigationLoadingProvider } from "@/components/navigation-loading";

export const metadata: Metadata = {
  title: {
    default: "SME Baraúna - Secretaria Municipal de Educação",
    template: "%s | SME Baraúna",
  },
  description:
    "Portal oficial da Secretaria Municipal de Educação de Baraúna - RN. Notícias, documentos e acesso ao sistema de gestão educacional integrado ao SIGEduc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
      </body>
    </html>
  );
}
