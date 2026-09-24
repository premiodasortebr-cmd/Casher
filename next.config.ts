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
    // O proxy (proxy.ts casa /admin/*) guarda o corpo até 10 MB por padrão e corta o
    // resto SEM erro — tem que ser maior que o limite acima + o envelope do multipart.
    proxyClientMaxBodySize: "26mb",
  },
};

export default nextConfig;
