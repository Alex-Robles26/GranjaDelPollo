"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { Aviso, Encabezado, Panel, Pildora } from "@/components/UI";
import { Ico } from "@/components/Iconos";

export default function PerfilCliente({ perfil }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(perfil.nombre || "");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [avisoNombre, setAvisoNombre] = useState(null);

  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [avisoClave, setAvisoClave] = useState(null);

  const esAdmin = perfil.rol === "admin";

  async function guardarNombre(e) {
    e.preventDefault();
    setAvisoNombre(null);
    setGuardandoNombre(true);
    const { error } = await supabaseCliente()
      .from("profiles")
      .update({ nombre: nombre.trim() })
      .eq("id", perfil.id);
    setGuardandoNombre(false);
    if (error) return setAvisoNombre({ tipo: "error", texto: error.message });
    setAvisoNombre({ tipo: "exito", texto: "Nombre actualizado." });
    router.refresh();
  }

  async function cambiarClave(e) {
    e.preventDefault();
    setAvisoClave(null);
    if (nueva.length < 8) {
      return setAvisoClave({ tipo: "error", texto: "Usa al menos 8 caracteres." });
    }
    if (nueva !== repetir) {
      return setAvisoClave({ tipo: "error", texto: "Las dos contraseñas no coinciden." });
    }
    setGuardandoClave(true);
    const { error } = await supabaseCliente().auth.updateUser({ password: nueva });
    setGuardandoClave(false);
    if (error) return setAvisoClave({ tipo: "error", texto: error.message });
    setNueva("");
    setRepetir("");
    setAvisoClave({ tipo: "exito", texto: "Contraseña cambiada." });
  }

  async function salir() {
    await supabaseCliente().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Encabezado titulo="Tu perfil" />

      <Panel titulo="Datos de la cuenta">
        <form onSubmit={guardarNombre} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-cascara px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-campo-900">
                {perfil.email}
              </p>
              <p className="text-xs text-campo-800/55">El correo no se puede cambiar.</p>
            </div>
            <Pildora tono={esAdmin ? "verde" : "neutro"}>
              {esAdmin ? "Administrador" : "Vendedor"}
            </Pildora>
          </div>

          <div>
            <label className="campo-label" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              className="campo-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          {avisoNombre && <Aviso tipo={avisoNombre.tipo}>{avisoNombre.texto}</Aviso>}

          <button type="submit" disabled={guardandoNombre} className="btn-suave">
            {guardandoNombre ? "Guardando…" : "Guardar nombre"}
          </button>
        </form>
      </Panel>

      <Panel titulo="Cambiar contraseña">
        <form onSubmit={cambiarClave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="campo-label" htmlFor="nueva">
                Nueva contraseña
              </label>
              <input
                id="nueva"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="campo-input"
                placeholder="Mínimo 8 caracteres"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
            </div>
            <div>
              <label className="campo-label" htmlFor="repetir">
                Repítela
              </label>
              <input
                id="repetir"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="campo-input"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
              />
            </div>
          </div>

          {avisoClave && <Aviso tipo={avisoClave.tipo}>{avisoClave.texto}</Aviso>}

          <button type="submit" disabled={guardandoClave} className="btn-principal">
            <Ico.Candado className="h-4 w-4" />
            {guardandoClave ? "Cambiando…" : "Cambiar contraseña"}
          </button>
        </form>
      </Panel>

      <Panel titulo="Sesión">
        <p className="mb-4 text-sm text-campo-800/70">
          Tu sesión se cierra sola después de 30 minutos sin actividad.
        </p>
        <button onClick={salir} className="btn-suave">
          <Ico.Salir className="h-4 w-4" />
          Cerrar sesión
        </button>
      </Panel>
    </div>
  );
}
