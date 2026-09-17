import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export async function supabaseServidor() {
  const galleta = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => galleta.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => galleta.set(name, value, options));
          } catch {
            // Los Server Components no pueden escribir cookies: lo hace el middleware.
          }
        },
      },
    }
  );
}

/** Devuelve el perfil del usuario actual o lo manda al login. */
export async function requerirSesion() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, email, nombre, rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil) redirect("/login");
  if (!perfil.activo) redirect("/login?estado=inactivo");
  return perfil;
}

/** Igual que requerirSesion, pero además exige rol de administrador. */
export async function requerirAdmin() {
  const perfil = await requerirSesion();
  if (perfil.rol !== "admin") redirect("/inicio?aviso=sin-permiso");
  return perfil;
}
