import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Layout";
import { requireAdminSession } from "@/lib/auth/guard";
import { ImportarForm } from "./ImportarForm";

export default async function ImportarFichasPage() {
  await requireAdminSession();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        eyebrow="Familhão"
        title="Importar fichas"
        description="Suba o arquivo .txt das fichas. Tudo que estiver nele entra no Familhão — uma ficha por pessoa. Reimportar atualiza, não duplica."
        back={
          <ButtonLink href="/admin" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
            Dashboard
          </ButtonLink>
        }
      />
      <ImportarForm />
    </div>
  );
}
