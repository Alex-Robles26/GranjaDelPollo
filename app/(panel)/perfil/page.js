import { requerirSesion } from "@/lib/supabase-servidor";
import PerfilCliente from "./PerfilCliente";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const perfil = await requerirSesion();
  return <PerfilCliente perfil={perfil} />;
}
