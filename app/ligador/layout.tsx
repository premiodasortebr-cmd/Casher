import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Área do Ligador — Familhão",
  description: "Acesse suas fichas de contato, registre retornos e gerencie prêmios no Familhão.",
  openGraph: {
    title: "Área do Ligador — Familhão",
    description: "Acesse suas fichas de contato, registre retornos e gerencie prêmios no Familhão.",
    type: "website",
  },
};

export default function LigadorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
