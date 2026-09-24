import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não existe página inicial: quem abre o domínio cai na área do ligador (o proxy
  // manda pro login ou pro /setup). O /admin só é acessado digitando o caminho.
  redirects() {
    return [{ source: "/", destination: "/ligador", permanent: false }];
  },
  experimental: {
    // O .txt do checker sobe por server action; o padrão (1 MB) corta arquivos grandes.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
