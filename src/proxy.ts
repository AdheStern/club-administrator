import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const path = request.nextUrl.pathname;

  // Si el usuario intenta entrar a cualquier ruta que empiece por /dashboard
  // y NO tiene la cookie de sesión, lo mandamos al login.
  if (path.startsWith("/dashboard") && !sessionCookie) {
    // Redirigir al Login (Root)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si el usuario entra al Login ("/") y SÍ tiene cookie,
  // no tiene sentido mostrarle el login, lo mandamos directo al dashboard.
  if (path === "/" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si no se cumple ninguna regla, dejar pasar la petición
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/"],
};
