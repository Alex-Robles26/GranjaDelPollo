import { requerirAdmin } from "@/lib/supabase-servidor";
import ReportesCliente from "./ReportesCliente";

export const dynamic = "force-dynamic";

export default async function Reportes() {
  await requerirAdmin();
  return <ReportesCliente />;
}
