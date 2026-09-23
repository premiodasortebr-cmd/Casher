import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Layout";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { requireAdminSession } from "@/lib/auth/guard";
import { ImportarForm } from "./ImportarForm";

export default async function ImportarRifasPage() {
  await requireAdminSession();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title="Importar fichas"
        description={
          <>
            Sobe o .txt do checker (padrão &quot;=== CPF ... ===&quot; com &quot;Compra N&quot;
            dentro). Cada &quot;Edição&quot; vira uma rifa e cada compra vira uma ficha.
            Reimportar o mesmo arquivo atualiza os dados em vez de duplicar.
          </>
        }
        back={
          <ButtonLink href="/admin/rifas" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
            Voltar
          </ButtonLink>
        }
      />

      <ImportarForm />
    </div>
  );
}
