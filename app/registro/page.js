"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { Aviso, Cargando } from "@/components/UI";

export default function Registro() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabaseCliente()
      .rpc("registro_abierto")
      .then(({ data, error: err }) => setAbierto(err ? false : Boolean(data)));
  }, []);

  async function crear(e) {
    e.preventDefault();
    setError("");
    if (clave.length < 8) {
      setError("Usa una contraseña de al menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    const supabase = supabaseCliente();
    const { error: err } = await supabase.auth.signUp({
      email: correo.trim(),
      password: clave,
      options: { data: { nombre: nombre.trim() } },
    });
    if (err) {
      setError(err.message);
      setEnviando(false);
      return;
    }

    const { error: errEntrar } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (errEntrar) {
      setMensaje(
        "Cuenta creada. Confirma tu correo desde el enlace que te enviamos y luego entra."
      );
      setEnviando(false);
      return;
    }
    router.replace("/inicio");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-[420px]">
        <Image
          src="/logo.png"
          alt="La Granja del Pollo"
          width={900}
          height={616}
          priority
          className="mx-auto mb-7 h-auto w-[230px]"
        />

        <div className="tarjeta p-6 sm:p-7">
          {abierto === null && <Cargando texto="Revisando la configuración…" />}

          {abierto === false && (
            <>
              <h1 className="font-titulo text-[22px] text-campo-900">
                El registro ya está cerrado
              </h1>
              <p className="mt-2 text-sm text-campo-800/70">
                Esta pantalla solo sirve una vez, para crear la cuenta del dueño del
                negocio. Las cuentas de vendedores se crean desde Usuarios.
              </p>
              <Link href="/login" className="btn-principal mt-5 w-full">
                Ir a entrar
              </Link>
            </>
          )}

          {abierto === true && (
            <>
              <h1 className="font-titulo text-[22px] text-campo-900">
                Crea tu cuenta de administrador
              </h1>
              <p className="mt-1 text-sm text-campo-800/65">
                Esta primera cuenta manda: ve costos, ganancias y crea vendedores.
              </p>

              {mensaje ? (
                <div className="mt-5 space-y-4">
                  <Aviso tipo="exito">{mensaje}</Aviso>
                  <Link href="/login" className="btn-principal w-full">
                    Ir a entrar
                  </Link>
                </div>
              ) : (
                <form onSubmit={crear} className="mt-5 space-y-4">
                  <div>
                    <label className="campo-label" htmlFor="nombre">
                      Tu nombre
                    </label>
                    <input
                      id="nombre"
                      required
                      className="campo-input"
                      placeholder="Juan Pérez"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="campo-label" htmlFor="correo">
                      Correo
                    </label>
                    <input
                      id="correo"
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="username"
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
                      minLength={8}
                      autoComplete="new-password"
                      className="campo-input"
                      placeholder="Mínimo 8 caracteres"
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                    />
                  </div>

                  {error && <Aviso tipo="error">{error}</Aviso>}

                  <button type="submit" disabled={enviando} className="btn-principal w-full">
                    {enviando ? "Creando…" : "Crear cuenta"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
