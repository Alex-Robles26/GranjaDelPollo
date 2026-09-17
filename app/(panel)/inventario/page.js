import { requerirAdmin } from "@/lib/supabase-servidor";
import InventarioCliente from "./InventarioCliente";

export const dynamic = "force-dynamic";

export default async function Inventario() {
  // Verificación de rol en el servidor: un vendedor nunca llega a renderizar esto.
  await requerirAdmin();
  return <InventarioCliente />;
}
