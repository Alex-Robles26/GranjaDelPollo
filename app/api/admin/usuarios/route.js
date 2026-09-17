import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase-servidor";

export const dynamic = "force-dynamic";

/**
 * Confirma, del lado del servidor, que quien llama es un administrador activo.
 * Nunca se confía en nada que venga del navegador.
 */
async function exigirAdmin() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión", estado: 401 };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.activo || perfil.rol !== "admin") {
    return { error: "No tienes permiso para esta acción", estado: 403 };
  }
  return { perfil };
}

function clienteDeServicio() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!llave) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request) {
  const guardia = await exigirAdmin();
  if (guardia.error) {
    return NextResponse.json({ error: guardia.error }, { status: guardia.estado });
  }

  const admin = clienteDeServicio();
  if (!admin) {
    return NextResponse.json(
      { error: "Falta la variable SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 }
    );
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const email = String(cuerpo.email || "").trim().toLowerCase();
  const password = String(cuerpo.password || "");
  const nombre = String(cuerpo.nombre || "").trim();
  const rol = cuerpo.rol === "admin" ? "admin" : "vendedor";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Correo no válido" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (error) {
    const mensaje = error.message?.includes("already been registered")
      ? "Ese correo ya tiene una cuenta."
      : error.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  // El rol se asigna aquí, en el servidor. El trigger de la base de datos
  // ya creó el perfil como 'vendedor' por defecto.
  const { error: errorRol } = await admin
    .from("profiles")
    .update({ rol, nombre: nombre || null })
    .eq("id", data.user.id);

  if (errorRol) {
    return NextResponse.json({ error: errorRol.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.user.id });
}

export async function DELETE(request) {
  const guardia = await exigirAdmin();
  if (guardia.error) {
    return NextResponse.json({ error: guardia.error }, { status: guardia.estado });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  if (id === guardia.perfil.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  const admin = clienteDeServicio();
  if (!admin) {
    return NextResponse.json(
      { error: "Falta la variable SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 }
    );
  }

  // Comprobamos que no sea el último administrador antes de borrar en auth.
  const { data: objetivo } = await admin
    .from("profiles")
    .select("rol, activo")
    .eq("id", id)
    .single();

  if (objetivo?.rol === "admin" && objetivo.activo) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("rol", "admin")
      .eq("activo", true);
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Debe quedar al menos un administrador activo" },
        { status: 400 }
      );
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
