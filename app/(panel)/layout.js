import { requerirSesion } from "@/lib/supabase-servidor";
import Navegacion from "@/components/Navegacion";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }) {
  // Verificación en el servidor: sin sesión válida no se renderiza nada.
  const perfil = await requerirSesion();
  return <Navegacion perfil={perfil}>{children}</Navegacion>;
}
