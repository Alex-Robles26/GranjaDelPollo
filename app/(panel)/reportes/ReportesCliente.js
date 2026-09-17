"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { dinero, numero, fechaCorta, hoyISO, restarDias } from "@/lib/formato";
import { GraficoBarras, GraficoLinea } from "@/components/Graficas";
import { Aviso, Cargando, Encabezado, Metrica, Panel, Vacio } from "@/components/UI";

const PERIODOS = [
  { id: "7", texto: "7 días", dias: 6, agrupar: "dia" },
  { id: "30", texto: "30 días", dias: 29, agrupar: "dia" },
  { id: "90", texto: "3 meses", dias: 89, agrupar: "semana" },
  { id: "365", texto: "12 meses", dias: 364, agrupar: "mes" },
];

export default function ReportesCliente() {
  const [periodo, setPeriodo] = useState("30");
  const [filas, setFilas] = useState([]);
  const [moneda, setMoneda] = useState("RD$");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const conf = PERIODOS.find((p) => p.id === periodo);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const supabase = supabaseCliente();
    const [r, s] = await Promise.all([
      supabase.rpc("reporte", {
        p_desde: restarDias(conf.dias),
        p_hasta: hoyISO(),
        p_agrupar: conf.agrupar,
      }),
      supabase.rpc("resumen"),
    ]);
    if (r.error) setError(r.error.message);
    else setFilas(r.data || []);
    if (s.data?.moneda) setMoneda(s.data.moneda);
    setCargando(false);
  }, [conf]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totales = useMemo(
    () =>
      filas.reduce(
        (a, f) => ({
          cartones: a.cartones + Number(f.cartones || 0),
          ingresos: a.ingresos + Number(f.ingresos || 0),
          costos: a.costos + Number(f.costos || 0),
          ganancia: a.ganancia + Number(f.ganancia || 0),
        }),
        { cartones: 0, ingresos: 0, costos: 0, ganancia: 0 }
      ),
    [filas]
  );

  const etiquetar = (fecha) => {
    if (conf.agrupar === "mes") {
      const d = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
      return d.toLocaleDateString("es-DO", { month: "short" });
    }
    return fechaCorta(fecha);
  };

  const datosBarras = filas.map((f) => ({
    etiqueta: etiquetar(f.periodo),
    valores: [Number(f.ingresos || 0), Number(f.costos || 0)],
  }));

  const datosLinea = filas.map((f) => ({
    etiqueta: etiquetar(f.periodo),
    valor: Number(f.ganancia || 0),
  }));

  const margen = totales.ingresos > 0 ? (totales.ganancia / totales.ingresos) * 100 : 0;
  const promedioDiario = filas.length ? totales.ganancia / filas.length : 0;

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Reportes"
        descripcion="Cómo se comportaron las ventas y la ganancia en el tiempo."
        accion={
          <div className="flex rounded-lg border border-trigo-300 bg-white p-0.5">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`rounded-[6px] px-2.5 py-1.5 text-sm transition-colors ${
                  periodo === p.id
                    ? "bg-campo-700 font-medium text-hueso"
                    : "text-campo-800/70 hover:bg-trigo-100"
                }`}
              >
                {p.texto}
              </button>
            ))}
          </div>
        }
      />

      {error && <Aviso tipo="error">{error}</Aviso>}

      {cargando ? (
        <Cargando texto="Calculando…" />
      ) : filas.length === 0 ? (
        <Panel>
          <Vacio
            titulo="No hay ventas en este período"
            texto="Prueba con un rango más amplio o registra ventas para ver los números."
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metrica
              etiqueta="Ingresos"
              valor={dinero(totales.ingresos, moneda)}
              detalle={`${numero(totales.cartones)} cartones`}
              tono="oro"
            />
            <Metrica etiqueta="Costos" valor={dinero(totales.costos, moneda)} tono="rojo" />
            <Metrica
              etiqueta="Ganancia"
              valor={dinero(totales.ganancia, moneda)}
              detalle={`Margen ${margen.toFixed(1)}%`}
              tono="verde"
            />
            <Metrica
              etiqueta={
                conf.agrupar === "dia"
                  ? "Ganancia por día"
                  : conf.agrupar === "semana"
                  ? "Ganancia por semana"
                  : "Ganancia por mes"
              }
              valor={dinero(promedioDiario, moneda)}
              detalle="Promedio del período"
            />
          </div>

          <Panel titulo="Ingresos frente a costos">
            <GraficoBarras
              datos={datosBarras}
              series={[
                { nombre: "Ingresos", color: "#2E4A2A" },
                { nombre: "Costos", color: "#C89B5C" },
              ]}
            />
          </Panel>

          <Panel titulo="Ganancia acumulada por período">
            <GraficoLinea datos={datosLinea} color="#4E7A3A" nombre="Ganancia" />
          </Panel>

          <Panel titulo="Detalle">
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-trigo-300 text-left text-[13px] text-campo-800/60">
                    <th className="pb-2 font-medium">Período</th>
                    <th className="pb-2 font-medium">Cartones</th>
                    <th className="pb-2 font-medium">Ingresos</th>
                    <th className="pb-2 font-medium">Costos</th>
                    <th className="pb-2 font-medium">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trigo-300/45">
                  {filas.map((f) => (
                    <tr key={f.periodo}>
                      <td className="py-2.5 text-campo-800/80">{etiquetar(f.periodo)}</td>
                      <td className="cifras py-2.5">{numero(f.cartones)}</td>
                      <td className="cifras py-2.5">{dinero(f.ingresos, moneda)}</td>
                      <td className="cifras py-2.5 text-campo-800/70">
                        {dinero(f.costos, moneda)}
                      </td>
                      <td className="cifras py-2.5 font-semibold text-campo-500">
                        {dinero(f.ganancia, moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
