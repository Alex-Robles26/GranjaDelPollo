export function dinero(valor, moneda = "RD$") {
  const n = Number(valor || 0);
  return `${moneda} ${n.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function numero(valor) {
  return Number(valor || 0).toLocaleString("es-DO");
}

export function fechaCorta(iso) {
  if (!iso) return "";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
}

export function fechaLarga(iso) {
  if (!iso) return "";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}

export function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function restarDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function inicioDeMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export const METODOS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  credito: "Fiado",
};
