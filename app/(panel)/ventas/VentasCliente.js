"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseCliente } from "@/lib/supabase-cliente";
import {
  dinero,
  numero,
  fechaCorta,
  hoyISO,
  restarDias,
  inicioDeMes,
  METODOS,
} from "@/lib/formato";
import { Aviso, Cargando, Encabezado, Panel, Pildora, Vacio } from "@/components/UI";
import { Ico } from "@/components/Iconos";

const RANGOS = [
  { id: "hoy", texto: "Hoy" },
  { id: "semana", texto: "7 días" },
  { id: "mes", texto: "Este mes" },
  { id: "todo", texto: "Todo" },
];

function limites(rango) {
  if (rango === "hoy") return { desde: hoyISO(), hasta: hoyISO() };
  if (rango === "semana") return { desde: restarDias(6), hasta: hoyISO() };
  if (rango === "mes") return { desde: inicioDeMes(), hasta: hoyISO() };
  return { desde: null, hasta: null };
}

export default function VentasCliente({ perfil }) {
  const esAdmin = perfil.rol === "admin";
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [rango, setRango] = useState("hoy");
  const [vendedor, setVendedor] = useState("");
  const [cargando, setCargando] = useState(true);

  const [cartones, setCartones] = useState("");
  const [cliente, setCliente] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const moneda = resumen?.moneda || "RD$";

  const cargarResumen = useCallback(async () => {
    const { data } = await supabaseCliente().rpc("resumen");
    setResumen(data);
  }, []);

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    const { desde, hasta } = limites(rango);
    const { data, error: err } = await supabaseCliente().rpc("listar_ventas", {
      p_desde: desde,
      p_hasta: hasta,
      p_vendedor: vendedor || null,
      p_limite: 300,
    });
    if (!err) setVentas(data || []);
    setCargando(false);
  }, [rango, vendedor]);

  useEffect(() => {
    cargarResumen();
    if (esAdmin) {
      supabaseCliente()
        .from("profiles")
        .select("id, nombre, email")
        .order("nombre")
        .then(({ data }) => setVendedores(data || []));
    }
  }, [cargarResumen, esAdmin]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const totales = useMemo(
    () =>
      ventas.reduce(
        (acc, v) => ({
          cartones: acc.cartones + Number(v.cartones || 0),
          total: acc.total + Number(v.total || 0),
          ganancia: acc.ganancia + Number(v.ganancia || 0),
        }),
        { cartones: 0, total: 0, ganancia: 0 }
      ),
    [ventas]
  );

  const cant = Number(cartones || 0);
  const previo = cant > 0 && resumen ? cant * Number(resumen.precio_carton || 0) : 0;

  async function registrar(e) {
    e.preventDefault();
    setError("");
    setExito("");
    if (!cant || cant <= 0) {
      setError("Escribe cuántos cartones vas a vender.");
      return;
    }
    setGuardando(true);
    const { error: err } = await supabaseCliente().rpc("registrar_venta", {
      p_cartones: cant,
      p_cliente: cliente || null,
      p_metodo: metodo,
    });
    setGuardando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setExito(`Venta registrada: ${numero(cant)} cartones por ${dinero(previo, moneda)}.`);
    setCartones("");
    setCliente("");
    await Promise.all([cargarResumen(), cargarVentas()]);
  }

  async function anular(id) {
    if (!confirm("¿Anular esta venta? Los cartones vuelven al inventario.")) return;
    const { error: err } = await supabaseCliente().rpc("anular_venta", { p_id: id });
    if (err) {
      setError(err.message);
      return;
    }
    await Promise.all([cargarResumen(), cargarVentas()]);
  }

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Ventas"
        descripcion="Cada venta descuenta los cartones del inventario al instante."
      />

      <Panel titulo="Nueva venta">
        {resumen && Number(resumen.precio_carton) <= 0 ? (
          <Aviso tipo="alerta">
            Falta definir el precio de venta por cartón.{" "}
            {esAdmin
              ? "Puedes hacerlo en Inventario."
              : "Pídele al administrador que lo configure."}
          </Aviso>
        ) : (
          <form onSubmit={registrar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="campo-label" htmlFor="cartones">
                  Cartones
                </label>
                <input
                  id="cartones"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  required
                  className="campo-input cifras text-lg"
                  placeholder="0"
                  value={cartones}
                  onChange={(e) => setCartones(e.target.value)}
                />
                <p className="mt-1 text-xs text-campo-800/55">
                  Disponibles: {numero(resumen?.stock ?? 0)}
                </p>
              </div>
              <div>
                <label className="campo-label" htmlFor="metodo">
                  Método de pago
                </label>
                <select
                  id="metodo"
                  className="campo-input"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                >
                  {Object.entries(METODOS).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="campo-label" htmlFor="cliente">
                Cliente <span className="font-normal text-campo-800/45">(opcional)</span>
              </label>
              <input
                id="cliente"
                className="campo-input"
                placeholder="Colmado La Esquina"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-trigo-100/70 px-4 py-3">
              <span className="text-sm text-tierra">Total a cobrar</span>
              <span className="cifras font-titulo text-[22px] text-campo-900">
                {dinero(previo, moneda)}
              </span>
            </div>

            {error && <Aviso tipo="error">{error}</Aviso>}
            {exito && <Aviso tipo="exito">{exito}</Aviso>}

            <button type="submit" disabled={guardando} className="btn-principal w-full sm:w-auto">
              <Ico.Check className="h-4 w-4" />
              {guardando ? "Guardando…" : "Registrar venta"}
            </button>
          </form>
        )}
      </Panel>

      <Panel
        titulo="Historial"
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {esAdmin && vendedores.length > 1 && (
              <select
                className="rounded-lg border border-trigo-300 bg-white px-2.5 py-1.5 text-sm"
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
              >
                <option value="">Todos los vendedores</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre || v.email}
                  </option>
                ))}
              </select>
            )}
            <div className="flex rounded-lg border border-trigo-300 p-0.5">
              {RANGOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRango(r.id)}
                  className={`rounded-[6px] px-2.5 py-1 text-sm transition-colors ${
                    rango === r.id
                      ? "bg-campo-700 font-medium text-hueso"
                      : "text-campo-800/70 hover:bg-trigo-100"
                  }`}
                >
                  {r.texto}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {cargando ? (
          <Cargando />
        ) : ventas.length === 0 ? (
          <Vacio
            titulo="Sin ventas en este período"
            texto="Cambia el filtro de fechas o registra una venta arriba."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-cascara px-4 py-3 text-sm">
              <span className="text-campo-800/70">
                {numero(ventas.length)} {ventas.length === 1 ? "venta" : "ventas"}
              </span>
              <span className="text-campo-800/70">
                {numero(totales.cartones)} cartones
              </span>
              <span className="cifras font-semibold text-campo-900">
                {dinero(totales.total, moneda)}
              </span>
              {esAdmin && (
                <span className="cifras font-semibold text-campo-500">
                  Ganancia {dinero(totales.ganancia, moneda)}
                </span>
              )}
            </div>

            <ul className="divide-y divide-trigo-300/45">
              {ventas.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-campo-900">
                      {numero(v.cartones)} {v.cartones === 1 ? "cartón" : "cartones"}
                      {v.cliente ? ` · ${v.cliente}` : ""}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-campo-800/55">
                      {fechaCorta(v.fecha)}
                      <Pildora>{METODOS[v.metodo_pago] || v.metodo_pago}</Pildora>
                      {esAdmin && <span>{v.vendedor}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="cifras text-[15px] font-semibold text-campo-900">
                        {dinero(v.total, moneda)}
                      </p>
                      {esAdmin && v.ganancia != null && (
                        <p className="cifras text-xs text-campo-500">
                          +{dinero(v.ganancia, moneda)}
                        </p>
                      )}
                    </div>
                    {esAdmin && (
                      <button
                        onClick={() => anular(v.id)}
                        aria-label="Anular venta"
                        className="rounded-lg p-2 text-campo-800/35 transition-colors hover:bg-cresta/10 hover:text-cresta"
                      >
                        <Ico.Basura className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}
