"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { Aviso } from "@/components/UI";

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(false);

  const estado = params.get("estado");

  useEffect(() => {
    supabaseCliente()
      .rpc("registro_abierto")
      .then(({ data }) => setRegistroAbierto(Boolean(data)))
      .catch(() => {});
  }, []);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const { error: err } = await supabaseCliente().auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (err) {
      setError(
        err.message?.includes("Invalid login")
          ? "El correo o la contraseña no coinciden."
          : err.message
      );
      setEnviando(false);
      return;
    }
    router.replace("/inicio");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-[400px]">
        <Image
          src="/logo.png"
          alt="La Granja del Pollo"
          width={900}
          height={616}
          priority
          className="mx-auto mb-7 h-auto w-[248px]"
        />

        <div className="tarjeta p-6 sm:p-7">
          <h1 className="font-titulo text-[22px] text-campo-900">Entrar al control</h1>
          <p className="mt-1 text-sm text-campo-800/65">
            Inventario, ventas y ganancias del negocio de huevos.
          </p>

          {estado === "inactividad" && (
            <div className="mt-4">
              <Aviso tipo="alerta">
                Cerramos tu sesión por 30 minutos sin actividad. Vuelve a entrar.
              </Aviso>
            </div>
          )}
          {estado === "inactivo" && (
            <div className="mt-4">
              <Aviso tipo="error">
                Tu cuenta está desactivada. Pídele al administrador que la active.
              </Aviso>
            </div>
          )}

          <form onSubmit={entrar} className="mt-5 space-y-4">
            <div>
              <label className="campo-label" htmlFor="correo">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                required
                autoComplete="username"
                inputMode="email"
                className="campo-input"
                placeholder="tucorreo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <div>
              <label className="campo-label" htmlFor="clave">
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                required
                autoComplete="current-password"
                className="campo-input"
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>

            {error && <Aviso tipo="error">{error}</Aviso>}

            <button type="submit" disabled={enviando} className="btn-principal w-full">
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>

          {registroAbierto && (
            <p className="mt-5 border-t border-trigo-300/50 pt-4 text-sm text-campo-800/70">
              Todavía no hay ninguna cuenta.{" "}
              <Link href="/registro" className="font-semibold text-campo-700 underline">
                Crea la del administrador
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
