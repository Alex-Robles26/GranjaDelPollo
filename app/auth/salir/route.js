import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase-servidor";

export async function POST(request) {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
