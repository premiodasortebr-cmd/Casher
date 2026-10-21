import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Consultar Prêmio — Familhão" },
  description: "Digite seu CPF e consulte se você foi contemplado no Familhão. Resgate seu prêmio via Pix.",
  openGraph: {
    title: "Consultar Prêmio — Familhão",
    description: "Digite seu CPF e consulte se você foi contemplado no Familhão. Resgate seu prêmio via Pix.",
    type: "website",
  },
};

export default function GanhadorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
