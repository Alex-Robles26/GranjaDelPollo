"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { dinero, numero, fechaLarga, hoyISO } from "@/lib/formato";
import {
  Aviso,
  Cargando,
  Encabezado,
  Metrica,
  Panel,
  Vacio,
} from "@/components/UI";
import { Ico } from "@/components/Iconos";

export default function InventarioCliente() {
  const [resumen, setResumen] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [fecha, setFecha] = useState(hoyISO());
  const [cartones, setCartones] = useState("");
  const [costo, setCosto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [precio, setPrecio] = useState("");
  const [alerta, setAlerta] = useState("");
  const [moneda, setMoneda] = useState("RD$");
  const [guardandoConf, setGuardandoConf] = useState(false);
  const [exitoConf, setExitoConf] = useState("");
  const [errorConf, setErrorConf] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = supabaseCliente();
    const [r, e] = await Promise.all([
      supabase.rpc("resumen"),
      supabase
        .from("entradas")
        .select("id, fecha, cartones, costo_carton, proveedor, nota")
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (r.data) {
      setResumen(r.data);
      setPrecio(String(r.data.precio_carton ?? ""));
      setAlerta(String(r.data.alerta_stock ?? ""));
      setMoneda(r.data.moneda || "RD$");
    }
    setEntradas(e.data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardarEntrada(ev) {
    ev.preventDefault();
    setError("");
    setExito("");
    const cant = Number(cartones);
    const cos = Number(costo);
    if (!cant || cant <= 0) return setError("Indica cuántos cartones entraron.");
    if (!(cos >= 0)) return setError("Indica el costo por cartón.");

    setGuardando(true);
    const { data: usuario } = await supabaseCliente().auth.getUser();
    const { error: err } = await supabaseCliente().from("entradas").insert({
      fecha,
      cartones: cant,
      costo_carton: cos,
      proveedor: proveedor.trim() || null,
      nota: nota.trim() || null,
      registrado_por: usuario?.user?.id ?? null,
    });
    setGuardando(false);
    if (err) return setError(err.message);

    setExito(`Entrada guardada: ${numero(cant)} cartones a ${dinero(cos, moneda)} cada uno.`);
    setCartones("");
    setCosto("");
    setProveedor("");
    setNota("");
    cargar();
  }

  async function guardarConfiguracion(ev) {
    ev.preventDefault();
    setErrorConf("");
    setExitoConf("");
    setGuardandoConf(true);
    const { error: err } = await supabaseCliente()
      .from("configuracion")
      .update({
        precio_carton: Number(precio || 0),
        alerta_stock: Number(alerta || 0),
        moneda: moneda.trim() || "RD$",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setGuardandoConf(false);
    if (err) return setErrorConf(err.message);
    setExitoConf("Configuración actualizada.");
    cargar();
  }

  async function borrarEntrada(id) {
    if (!confirm("¿Eliminar esta entrada? El stock se recalcula al instante.")) return;
    const { error: err } = await supabaseCliente().from("entradas").delete().eq("id", id);
    if (err) return setError(err.message);
    cargar();
  }

  if (cargando && !resumen) return <Cargando texto="Cargando inventario…" />;

  const margen =
    Number(resumen?.precio_carton || 0) - Number(resumen?.costo_promedio || 0);
  const margenPct =
    Number(resumen?.precio_carton || 0) > 0
      ? (margen / Number(resumen.precio_carton)) * 100
      : 0;

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Inventario"
        descripcion="Todo se maneja en cartones de 30 huevos."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica
          etiqueta="Cartones en stock"
          valor={numero(resumen?.stock ?? 0)}
          detalle={`${numero((resumen?.stock ?? 0) * 30)} huevos`}
          tono={
            (resumen?.stock ?? 0) <= (resumen?.alerta_stock ?? 0) ? "rojo" : "verde"
          }
        />
        <Metrica
          etiqueta="Costo promedio"
          valor={dinero(resumen?.costo_promedio, moneda)}
          detalle="Por cartón"
        />
        <Metrica
          etiqueta="Precio de venta"
          valor={dinero(resumen?.precio_carton, moneda)}
          detalle={`Margen ${margenPct.toFixed(0)}%`}
          tono="oro"
        />
        <Metrica
          etiqueta="Valor del inventario"
          valor={dinero(resumen?.valor_inventario, moneda)}
          detalle="Al costo promedio"
        />
      </div>

      {(resumen?.stock ?? 0) <= (resumen?.alerta_stock ?? 0) && (
        <Aviso tipo="alerta">
          Quedan {numero(resumen?.stock ?? 0)} cartones, por debajo de tu aviso de{" "}
          {numero(resumen?.alerta_stock ?? 0)}. Es momento de comprar mercancía.
        </Aviso>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel titulo="Registrar entrada de mercancía">
          <form onSubmit={guardarEntrada} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="campo-label" htmlFor="cant">
                  Cartones que entraron
                </label>
                <input
                  id="cant"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  required
                  className="campo-input cifras"
                  placeholder="0"
                  value={cartones}
                  onChange={(e) => setCartones(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="costo">
                  Costo por cartón
                </label>
                <input
                  id="costo"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  required
                  className="campo-input cifras"
                  placeholder="0.00"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="fecha">
                  Fecha
                </label>
                <input
                  id="fecha"
                  type="date"
                  required
                  className="campo-input"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="prov">
                  Proveedor{" "}
                  <span className="font-normal text-campo-800/45">(opcional)</span>
                </label>
                <input
                  id="prov"
                  className="campo-input"
                  placeholder="Granja San Rafael"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="campo-label" htmlFor="nota">
                Nota <span className="font-normal text-campo-800/45">(opcional)</span>
              </label>
              <input
                id="nota"
                className="campo-input"
                placeholder="Huevos grandes, factura 0042"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>

            {Number(cartones) > 0 && Number(costo) >= 0 && (
              <div className="flex items-center justify-between rounded-lg bg-trigo-100/70 px-4 py-3">
                <span className="text-sm text-tierra">Total de la compra</span>
                <span className="cifras font-titulo text-[20px] text-campo-900">
                  {dinero(Number(cartones) * Number(costo || 0), moneda)}
                </span>
              </div>
            )}

            {error && <Aviso tipo="error">{error}</Aviso>}
            {exito && <Aviso tipo="exito">{exito}</Aviso>}

            <button type="submit" disabled={guardando} className="btn-principal w-full sm:w-auto">
              <Ico.Mas className="h-4 w-4" />
              {guardando ? "Guardando…" : "Guardar entrada"}
            </button>
          </form>
        </Panel>

        <Panel titulo="Precios y avisos">
          <form onSubmit={guardarConfiguracion} className="space-y-4">
            <div>
              <label className="campo-label" htmlFor="precio">
                Precio de venta por cartón
              </label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                className="campo-input cifras text-lg"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
              <p className="mt-1 text-xs text-campo-800/55">
                Es el precio que se aplica a toda venta nueva.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="campo-label" htmlFor="alerta">
                  Avisar cuando queden menos de
                </label>
                <input
                  id="alerta"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  required
                  className="campo-input cifras"
                  value={alerta}
                  onChange={(e) => setAlerta(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="moneda">
                  Símbolo de moneda
                </label>
                <input
                  id="moneda"
                  className="campo-input"
                  maxLength={5}
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                />
              </div>
            </div>

            {errorConf && <Aviso tipo="error">{errorConf}</Aviso>}
            {exitoConf && <Aviso tipo="exito">{exitoConf}</Aviso>}

            <button
              type="submit"
              disabled={guardandoConf}
              className="btn-oro w-full sm:w-auto"
            >
              {guardandoConf ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-trigo-300/60 bg-cascara px-4 py-3 text-sm text-campo-800/75">
            Con el costo promedio actual de {dinero(resumen?.costo_promedio, moneda)},
            cada cartón vendido a {dinero(resumen?.precio_carton, moneda)} deja{" "}
            <span className="cifras font-semibold text-campo-900">
              {dinero(margen, moneda)}
            </span>{" "}
            de ganancia.
          </div>
        </Panel>
      </div>

      <Panel titulo="Entradas registradas">
        {entradas.length === 0 ? (
          <Vacio
            titulo="Sin entradas todavía"
            texto="Registra tu primera compra de cartones para empezar a vender."
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-trigo-300 text-left text-[13px] text-campo-800/60">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Cartones</th>
                  <th className="pb-2 font-medium">Costo unitario</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Proveedor</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-300/45">
                {entradas.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 text-campo-800/80">{fechaLarga(e.fecha)}</td>
                    <td className="cifras py-2.5 font-medium">{numero(e.cartones)}</td>
                    <td className="cifras py-2.5">{dinero(e.costo_carton, moneda)}</td>
                    <td className="cifras py-2.5 font-semibold">
                      {dinero(e.cartones * e.costo_carton, moneda)}
                    </td>
                    <td className="py-2.5 text-campo-800/70">
                      {e.proveedor || "—"}
                      {e.nota && (
                        <span className="block text-xs text-campo-800/45">{e.nota}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => borrarEntrada(e.id)}
                        aria-label="Eliminar entrada"
                        className="rounded-lg p-2 text-campo-800/35 transition-colors hover:bg-cresta/10 hover:text-cresta"
                      >
                        <Ico.Basura className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
