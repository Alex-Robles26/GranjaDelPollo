"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseCliente } from "@/lib/supabase-cliente";
import { fechaLarga } from "@/lib/formato";
import { Aviso, Cargando, Encabezado, Panel, Pildora } from "@/components/UI";
import { Ico } from "@/components/Iconos";

export default function UsuariosCliente({ perfil }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error: err } = await supabaseCliente()
      .from("profiles")
      .select("id, email, nombre, rol, activo, created_at")
      .order("created_at");
    if (err) setError(err.message);
    else setUsuarios(data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e) {
    e.preventDefault();
    setError("");
    setExito("");
    if (clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");

    setCreando(true);
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email: correo, password: clave, rol }),
    });
    const cuerpo = await res.json();
    setCreando(false);
    if (!res.ok) return setError(cuerpo.error || "No se pudo crear el usuario.");

    setExito(`${nombre || correo} ya puede entrar con ese correo y contraseña.`);
    setNombre("");
    setCorreo("");
    setClave("");
    setRol("vendedor");
    setAbierto(false);
    cargar();
  }

  async function cambiarRol(usuario, nuevoRol) {
    setError("");
    setExito("");
    const { error: err } = await supabaseCliente()
      .from("profiles")
      .update({ rol: nuevoRol })
      .eq("id", usuario.id);
    if (err) return setError(err.message);
    cargar();
  }

  async function cambiarEstado(usuario) {
    setError("");
    setExito("");
    const { error: err } = await supabaseCliente()
      .from("profiles")
      .update({ activo: !usuario.activo })
      .eq("id", usuario.id);
    if (err) return setError(err.message);
    cargar();
  }

  async function eliminar(usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${usuario.nombre || usuario.email}?`)) return;
    setError("");
    setExito("");
    const res = await fetch(`/api/admin/usuarios?id=${usuario.id}`, { method: "DELETE" });
    const cuerpo = await res.json();
    if (!res.ok) return setError(cuerpo.error || "No se pudo eliminar.");
    setExito("Cuenta eliminada.");
    cargar();
  }

  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Usuarios"
        descripcion="El vendedor solo registra ventas y ve el stock. Nunca ve costos ni ganancias."
        accion={
          <button onClick={() => setAbierto((v) => !v)} className="btn-principal">
            <Ico.Mas className="h-4 w-4" />
            {abierto ? "Cancelar" : "Agregar usuario"}
          </button>
        }
      />

      {error && <Aviso tipo="error">{error}</Aviso>}
      {exito && <Aviso tipo="exito">{exito}</Aviso>}

      {abierto && (
        <Panel titulo="Nuevo usuario">
          <form onSubmit={crear} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="campo-label" htmlFor="n">
                  Nombre
                </label>
                <input
                  id="n"
                  required
                  className="campo-input"
                  placeholder="María Rodríguez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="c">
                  Correo
                </label>
                <input
                  id="c"
                  type="email"
                  required
                  inputMode="email"
                  className="campo-input"
                  placeholder="maria@ejemplo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
              <div>
                <label className="campo-label" htmlFor="p">
                  Contraseña temporal
                </label>
                <input
                  id="p"
                  type="text"
                  required
                  minLength={8}
                  className="campo-input"
                  placeholder="Mínimo 8 caracteres"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                />
                <p className="mt-1 text-xs text-campo-800/55">
                  Compártela una vez; la persona puede cambiarla desde su perfil.
                </p>
              </div>
              <div>
                <label className="campo-label" htmlFor="r">
                  Rol
                </label>
                <select
                  id="r"
                  className="campo-input"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={creando} className="btn-principal w-full sm:w-auto">
              {creando ? "Creando…" : "Crear usuario"}
            </button>
          </form>
        </Panel>
      )}

      <Panel titulo={`Cuentas (${usuarios.length})`}>
        {cargando ? (
          <Cargando />
        ) : (
          <ul className="divide-y divide-trigo-300/45">
            {usuarios.map((u) => {
              const soyYo = u.id === perfil.id;
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-campo-900">
                      {u.nombre || u.email}
                      {soyYo && <Pildora tono="oro">Tú</Pildora>}
                      {!u.activo && <Pildora tono="rojo">Desactivada</Pildora>}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-campo-800/55">
                      {u.email} · desde {fechaLarga(u.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={u.rol}
                      disabled={soyYo}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                      className="rounded-lg border border-trigo-300 bg-white px-2.5 py-1.5 text-sm disabled:opacity-50"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </select>

                    <button
                      onClick={() => cambiarEstado(u)}
                      disabled={soyYo}
                      className="btn-suave disabled:opacity-40"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => eliminar(u)}
                      disabled={soyYo}
                      aria-label="Eliminar usuario"
                      className="rounded-lg p-2 text-campo-800/35 transition-colors hover:bg-cresta/10 hover:text-cresta disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-campo-800/35"
                    >
                      <Ico.Basura className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 border-t border-trigo-300/50 pt-3 text-xs leading-relaxed text-campo-800/55">
          No puedes cambiar tu propio rol ni eliminar tu cuenta, y el sistema exige que
          siempre quede al menos un administrador activo.
        </p>
      </Panel>
    </div>
  );
}
