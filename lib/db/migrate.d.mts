export interface ResultadoMigracao {
  arquivo: string;
  status: "aplicada" | "ja_aplicada" | "erro";
  erro?: string;
}

export function rodarMigrations(
  connectionString: string,
  opcoes?: { dir?: string },
): Promise<ResultadoMigracao[]>;
