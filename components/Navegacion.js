"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { Ico } from "./Iconos";

const MINUTOS_INACTIVIDAD = 30;

const MENU = [
  { href: "/inicio", texto: "Inicio", Icono: Ico.Inicio, admin: false },
  { href: "/ventas", texto: "Ventas", Icono: Ico.Venta, admin: false },
  { href: "/inventario", texto: "Inventario", Icono: Ico.Inventario, admin: true },
  { href: "/reportes", texto: "Reportes", Icono: Ico.Reportes, admin: true },
  { href: "/usuarios", texto: "Usuarios", Icono: Ico.Usuarios, admin: true },
  { href: "/perfil", texto: "Perfil", Icono: Ico.Perfil, admin: false },
];

export default function Navegacion({ perfil, children }) {
  const ruta = usePathname();
  const router = useRouter();
  const temporizador = useRef(null);
  const [cerrando, setCerrando] = useState(false);

  const esAdmin = perfil.rol === "admin";
  const items = MENU.filter((m) => !m.admin || esAdmin);
  // En móvil la barra inferior muestra como máximo 5 destinos.
  const itemsMovil = esAdmin
    ? items.filter((m) => m.href !== "/perfil")
    : items;

  // Cierre de sesión automático tras 30 minutos sin actividad.
  useEffect(() => {
    const supabase = supabaseCliente();
    const salir = async () => {
      await supabase.auth.signOut();
      router.replace("/login?estado=inactividad");
    };
    const reiniciar = () => {
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(salir, MINUTOS_INACTIVIDAD * 60 * 1000);
    };
    const eventos = ["click", "keydown", "scroll", "touchstart", "visibilitychange"];
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    return () => {
      clearTimeout(temporizador.current);
      eventos.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [router]);

  const cerrarSesion = async () => {
    setCerrando(true);
    await supabaseCliente().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const activo = (href) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:flex">
      {/* ---------- Barra lateral (PC / tablet horizontal) ---------- */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-campo-800 lg:flex">
        <div className="border-b border-trigo-500/25 px-6 pb-6 pt-7">
          <Link href="/inicio" className="block">
            <Image
              src="/logo.png"
              alt="La Granja del Pollo"
              width={900}
              height={616}
              priority
              className="h-auto w-full max-w-[188px] drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]"
            />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {items.map(({ href, texto, Icono }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                activo(href)
                  ? "bg-campo-900/70 font-semibold text-trigo-300"
                  : "text-hueso/70 hover:bg-campo-900/40 hover:text-hueso"
              }`}
            >
              {activo(href) && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-trigo-500" />
              )}
              <Icono className="h-5 w-5" />
              {texto}
            </Link>
          ))}
        </nav>

        <div className="border-t border-trigo-500/25 px-4 py-4">
          <p className="truncate text-sm font-semibold text-hueso">
            {perfil.nombre || perfil.email}
          </p>
          <p className="mb-3 text-xs text-trigo-300">
            {esAdmin ? "Administrador" : "Vendedor"}
          </p>
          <button
            onClick={cerrarSesion}
            disabled={cerrando}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-hueso/70 transition-colors hover:bg-campo-900/50 hover:text-hueso"
          >
            <Ico.Salir className="h-4 w-4" />
            {cerrando ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* ---------- Barra superior (móvil) ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-trigo-500/25 bg-campo-800 px-4 py-2.5 lg:hidden">
          <Link href="/inicio" className="flex items-center gap-2.5">
            <Image
              src="/icon.png"
              alt=""
              width={256}
              height={256}
              priority
              className="h-9 w-9"
            />
            <span className="font-titulo text-[17px] leading-none text-hueso">
              La Granja del Pollo
            </span>
          </Link>
          <Link
            href="/perfil"
            aria-label="Perfil"
            className={`rounded-full p-2 ${
              activo("/perfil") ? "bg-campo-900 text-trigo-300" : "text-hueso/75"
            }`}
          >
            <Ico.Perfil className="h-5 w-5" />
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        {/* ---------- Barra inferior (móvil) ---------- */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-trigo-300/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg">
            {itemsMovil.map(({ href, texto, Icono }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  activo(href) ? "text-campo-700" : "text-campo-800/50"
                }`}
              >
                <span
                  className={`rounded-lg px-3 py-1 ${
                    activo(href) ? "bg-trigo-100" : ""
                  }`}
                >
                  <Icono className="h-[21px] w-[21px]" />
                </span>
                {texto}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
