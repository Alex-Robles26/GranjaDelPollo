import { requerirAdmin } from "@/lib/supabase-servidor";
import UsuariosCliente from "./UsuariosCliente";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const perfil = await requerirAdmin();
  return <UsuariosCliente perfil={perfil} />;
}
