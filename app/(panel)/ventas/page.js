import { requerirSesion } from "@/lib/supabase-servidor";
import VentasCliente from "./VentasCliente";

export const dynamic = "force-dynamic";

export default async function Ventas() {
  const perfil = await requerirSesion();
  return <VentasCliente perfil={perfil} />;
}
