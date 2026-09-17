import { requerirSesion } from "@/lib/supabase-servidor";
import InicioCliente from "./InicioCliente";

export const dynamic = "force-dynamic";

export default async function Inicio({ searchParams }) {
  const perfil = await requerirSesion();
  const params = await searchParams;
  return <InicioCliente perfil={perfil} aviso={params?.aviso ?? null} />;
}
