import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Configuration des routes protégées
const protectedRoutes = ["/admin"];
const authRoutes = ["/auth/signin", "/auth/error", "/auth/access-denied"];
const publicRoutes = ["/", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permettre l'accès aux routes d'authentification et publiques
  if (
    authRoutes.some((route) => pathname.startsWith(route)) ||
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  try {
    // Obtenir le token JWT de la session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Vérifier si la route nécessite une authentification
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      // Rediriger vers la page de connexion si non authentifié
      if (!token) {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Vérifier le statut d'agent public pour les routes admin
      if (pathname.startsWith("/admin")) {
        if (!token.isPublicAgent) {
          const accessDeniedUrl = new URL("/auth/access-denied", request.url);
          return NextResponse.redirect(accessDeniedUrl);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erreur dans le middleware d'authentification:", error);

    // En cas d'erreur, rediriger vers la page d'erreur
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "MiddlewareError");
    return NextResponse.redirect(errorUrl);
  }
}

// Configuration du matcher pour spécifier les routes où le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
