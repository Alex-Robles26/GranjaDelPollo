"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { dinero, numero, fechaCorta, METODOS } from "@/lib/formato";
import { Aviso, Cargando, Metrica, Panel, Pildora, Vacio } from "@/components/UI";
import { Ico } from "@/components/Iconos";

export default function InicioCliente({ perfil, aviso }) {
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState("");
  const esAdmin = perfil.rol === "admin";

  const cargar = useCallback(async () => {
    const supabase = supabaseCliente();
    const [r, v] = await Promise.all([
      supabase.rpc("resumen"),
      supabase.rpc("listar_ventas", { p_limite: 6 }),
    ]);
    if (r.error) setError(r.error.message);
    else setResumen(r.data);
    if (!v.error) setVentas(v.data || []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (!resumen) return <Cargando texto="Cargando tu negocio…" />;

  const moneda = resumen.moneda || "RD$";
  const stockBajo = resumen.stock <= resumen.alerta_stock;
  const proporcion = Math.min(
    100,
    resumen.alerta_stock > 0
      ? (resumen.stock / (resumen.alerta_stock * 4)) * 100
      : 100
  );

  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[15px] text-campo-800/65">
          {saludo}, {(perfil.nombre || "").split(" ")[0] || "bienvenido"}
        </p>
        <h1 className="font-titulo text-[26px] leading-tight text-campo-900 sm:text-[30px]">
          Resumen del negocio
        </h1>
      </div>

      {aviso === "sin-permiso" && (
        <Aviso tipo="alerta">
          Esa sección es solo para el administrador, así que te trajimos de vuelta aquí.
        </Aviso>
      )}

      {/* Bloque principal: el inventario disponible manda en esta pantalla */}
      <section className="overflow-hidden rounded-xl2 border border-trigo-300/55 bg-campo-800 text-hueso shadow-panel">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-4 pt-5">
          <div>
            <p className="text-[13px] text-trigo-300">Cartones disponibles</p>
            <p className="cifras font-titulo text-[54px] leading-none sm:text-[64px]">
              {numero(resumen.stock)}
            </p>
            <p className="mt-1.5 text-sm text-hueso/65">
              {numero(resumen.stock * 30)} huevos · cartón de 30
            </p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-trigo-300">Precio por cartón</p>
            <p className="cifras font-titulo text-[24px] leading-tight">
              {dinero(resumen.precio_carton, moneda)}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-campo-900">
            <div
              className={`h-full rounded-full ${stockBajo ? "bg-cresta" : "bg-trigo-500"}`}
              style={{ width: `${Math.max(proporcion, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-hueso/60">
            Aviso de stock bajo a partir de {numero(resumen.alerta_stock)} cartones
          </p>
        </div>

        {stockBajo && (
          <div className="flex items-center gap-2.5 border-t border-cresta/40 bg-cresta/20 px-5 py-3 text-sm">
            <Ico.Alerta className="h-4 w-4 shrink-0" />
            <span>
              Quedan {numero(resumen.stock)} cartones.{" "}
              {esAdmin ? "Conviene comprar mercancía." : "Avísale al administrador."}
            </span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica
          etiqueta="Vendidos hoy"
          valor={`${numero(resumen.cartones_hoy)} cart.`}
          tono="verde"
        />
        <Metrica
          etiqueta="Ingresos de hoy"
          valor={dinero(resumen.total_hoy, moneda)}
          tono="oro"
        />
        {esAdmin ? (
          <>
            <Metrica
              etiqueta="Ganancia de hoy"
              valor={dinero(resumen.ganancia_hoy, moneda)}
              tono="verde"
            />
            <Metrica
              etiqueta="Ganancia del mes"
              valor={dinero(resumen.ganancia_mes, moneda)}
              detalle={`Ingresos: ${dinero(resumen.total_mes, moneda)}`}
              tono="verde"
            />
          </>
        ) : (
          <>
            <Metrica
              etiqueta="Últimos 7 días"
              valor={dinero(resumen.total_semana, moneda)}
              detalle="Tus ventas"
            />
            <Metrica
              etiqueta="Este mes"
              valor={dinero(resumen.total_mes, moneda)}
              detalle="Tus ventas"
            />
          </>
        )}
      </div>

      {esAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <Metrica
            etiqueta="Costo promedio por cartón"
            valor={dinero(resumen.costo_promedio, moneda)}
            detalle={`Margen: ${dinero(
              (resumen.precio_carton || 0) - (resumen.costo_promedio || 0),
              moneda
            )}`}
          />
          <Metrica
            etiqueta="Valor del inventario"
            valor={dinero(resumen.valor_inventario, moneda)}
            detalle="Al costo promedio"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/ventas" className="btn-principal flex-1 sm:flex-none">
          <Ico.Mas className="h-4 w-4" />
          Registrar una venta
        </Link>
        {esAdmin && (
          <Link href="/inventario" className="btn-suave flex-1 justify-center sm:flex-none">
            <Ico.Inventario className="h-4 w-4" />
            Entrada de mercancía
          </Link>
        )}
      </div>

      <Panel
        titulo="Últimas ventas"
        extra={
          <Link href="/ventas" className="text-sm font-medium text-campo-700 underline">
            Ver todas
          </Link>
        }
      >
        {ventas.length === 0 ? (
          <Vacio
            titulo="Todavía no hay ventas"
            texto="Cuando registres la primera, aparecerá aquí con su total."
          />
        ) : (
          <ul className="divide-y divide-trigo-300/45">
            {ventas.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
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
                <div className="shrink-0 text-right">
                  <p className="cifras text-[15px] font-semibold text-campo-900">
                    {dinero(v.total, moneda)}
                  </p>
                  {esAdmin && v.ganancia != null && (
                    <p className="cifras text-xs text-campo-500">
                      +{dinero(v.ganancia, moneda)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
