"use client";

import { createBrowserClient } from "@supabase/ssr";

let cliente;

export function supabaseCliente() {
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    cliente = createBrowserClient(url, llave, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cliente;
}
