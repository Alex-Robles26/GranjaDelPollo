import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas que solo puede abrir un administrador. La verificación ocurre aquí
// (servidor), en el layout de cada página (servidor) y en la base de datos
// (RLS). Escribir la URL a mano no sirve de nada.
const RUTAS_ADMIN = ["/inventario", "/reportes", "/usuarios"];
const RUTAS_PUBLICAS = ["/login", "/registro"];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((p) => ruta.startsWith(p));

  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && RUTAS_ADMIN.some((p) => ruta.startsWith(p))) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();

    if (!perfil || !perfil.activo || perfil.rol !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/inicio";
      url.search = "?aviso=sin-permiso";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|logo-sm.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
