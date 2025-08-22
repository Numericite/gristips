/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { SessionValidationResult } from "./types";

// Utilitaire pour obtenir la session côté serveur
export async function getServerAuthSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"]
) {
  return await getServerSession(req, res, authOptions);
}

// Vérification du statut d'agent public
export function isPublicAgent(session: any): boolean {
  return session?.user?.isPublicAgent === true;
}

// Utilitaire pour protéger les routes API
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  requirePublicAgent: boolean = false
) {
  const session = await getServerAuthSession(req, res);

  if (!session) {
    return res.status(401).json({
      error: "Non authentifié",
      message: "Vous devez être connecté pour accéder à cette ressource",
    });
  }

  if (requirePublicAgent && !isPublicAgent(session)) {
    return res.status(403).json({
      error: "Accès refusé",
      message: "Seuls les agents publics peuvent accéder à cette ressource",
    });
  }

  return session;
}

// Utilitaire pour protéger les pages côté serveur
export async function requireAuthSSR(
  context: GetServerSidePropsContext,
  requirePublicAgent: boolean = false
) {
  const session = await getServerAuthSession(context.req, context.res);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  if (requirePublicAgent && !isPublicAgent(session)) {
    return {
      redirect: {
        destination: "/auth/error?error=AccessDenied",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}

// Utilitaires pour la gestion des sessions
export async function validateSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"]
): Promise<SessionValidationResult> {
  const session = await getServerAuthSession(req, res);

  if (!session) {
    return { valid: false, session: null, reason: "no_session" };
  }

  // Vérifier si la session n'est pas expirée côté serveur
  const now = new Date();
  const sessionExpiry = new Date(session.expires);

  if (now > sessionExpiry) {
    return { valid: false, session: null, reason: "expired" };
  }

  return { valid: true, session, reason: null };
}

// Utilitaire pour invalider une session
export async function invalidateSession(sessionToken: string) {
  try {
    // Cette fonction sera utilisée pour invalider une session spécifique
    // Elle peut être étendue pour supprimer la session de la base de données
    console.log(`Invalidation de la session: ${sessionToken}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'invalidation de la session:", error);
    return false;
  }
}

// Utilitaire pour la déconnexion sécurisée
export function getSecureSignOutUrl(
  baseUrl: string,
  callbackUrl?: string
): string {
  const signOutUrl = new URL("/api/auth/signout", baseUrl);
  if (callbackUrl) {
    signOutUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return signOutUrl.toString();
}
