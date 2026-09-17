"use client";

import { Ico } from "./Iconos";

export function Encabezado({ titulo, descripcion, accion }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-titulo text-[26px] leading-tight text-campo-900 sm:text-[30px]">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 max-w-prose text-[15px] text-campo-800/70">{descripcion}</p>
        )}
      </div>
      {accion}
    </div>
  );
}

export function Metrica({ etiqueta, valor, detalle, tono = "neutro" }) {
  const barra = {
    neutro: "bg-trigo-300",
    verde: "bg-campo-500",
    oro: "bg-trigo-500",
    rojo: "bg-cresta",
  }[tono];

  return (
    <div className="tarjeta overflow-hidden">
      <div className={`h-1 w-full ${barra}`} />
      <div className="px-4 py-3.5">
        <p className="text-[13px] text-campo-800/65">{etiqueta}</p>
        <p className="cifras mt-1 font-titulo text-[22px] leading-tight text-campo-900">
          {valor}
        </p>
        {detalle && <p className="mt-0.5 text-xs text-campo-800/55">{detalle}</p>}
      </div>
    </div>
  );
}

export function Panel({ titulo, extra, children, className = "" }) {
  return (
    <section className={`tarjeta ${className}`}>
      {(titulo || extra) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-trigo-300/50 px-4 py-3">
          <h2 className="font-titulo text-[17px] text-campo-900">{titulo}</h2>
          {extra}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Aviso({ tipo = "info", children }) {
  const estilos = {
    info: "border-trigo-300 bg-trigo-100/60 text-tierra",
    exito: "border-campo-500/45 bg-campo-500/10 text-campo-800",
    error: "border-cresta/35 bg-cresta/8 text-cresta",
    alerta: "border-yema/50 bg-yema/12 text-tierra",
  }[tipo];

  const Icono = tipo === "error" || tipo === "alerta" ? Ico.Alerta : Ico.Check;

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${estilos}`}>
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Vacio({ titulo, texto }) {
  return (
    <div className="rounded-lg border border-dashed border-trigo-300 px-4 py-10 text-center">
      <p className="font-titulo text-[17px] text-campo-900">{titulo}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-campo-800/60">{texto}</p>
    </div>
  );
}

export function Pildora({ children, tono = "neutro" }) {
  const estilos = {
    neutro: "bg-trigo-100 text-tierra",
    verde: "bg-campo-500/15 text-campo-800",
    rojo: "bg-cresta/12 text-cresta",
    oro: "bg-trigo-500/25 text-trigo-700",
  }[tono];
  return <span className={`pildora ${estilos}`}>{children}</span>;
}

export function Cargando({ texto = "Cargando…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-campo-800/55">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-trigo-300 border-t-campo-700" />
      {texto}
    </div>
  );
}
