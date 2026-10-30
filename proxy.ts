import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicConfiguration } from "@/lib/configuration";

export async function proxy(request: NextRequest) {
  if (!hasSupabasePublicConfiguration()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/admin" || pathname.startsWith("/admin/");
  const authPage = pathname === "/login" || pathname === "/signup" || pathname === "/admin-access";
  let role: string | null = null;

  if (user && (protectedPath || authPage)) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  if (pathname.startsWith("/dashboard") && role !== "client") {
    const destination = !user ? "/login" : role === "admin" ? "/admin" : "/login";
    return NextResponse.redirect(new URL(destination, request.url));
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin-access" && role !== "admin") {
    const destination = !user ? "/admin-access" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }
  if (authPage && role) return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup", "/admin-access"],
};