"use server";

import { redirect } from "next/navigation";
import { encerrarSessaoCookie } from "@/lib/auth/session";

export async function sairAdmin(): Promise<void> {
  await encerrarSessaoCookie();
  redirect("/admin/login");
}

export async function sairLigador(): Promise<void> {
  await encerrarSessaoCookie();
  redirect("/ligador/login");
}
