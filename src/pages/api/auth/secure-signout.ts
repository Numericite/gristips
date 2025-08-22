import { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession, invalidateSession } from "../../../lib/auth";
import { getToken } from "next-auth/jwt";
import {
  withErrorHandling,
  validateHttpMethod,
  logAuthEvent,
} from "../../../lib/error-handling";

async function secureSignoutHandler(req: NextApiRequest, res: NextApiResponse) {
  // Valider la méthode HTTP
  if (!validateHttpMethod(req, res, ["POST"])) {
    return;
  }

  // Obtenir la session actuelle
  const session = await getServerAuthSession(req, res);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (session && token) {
    try {
      // Log de la déconnexion pour audit
      logAuthEvent("signout", {
        userId: session.user.id,
        email: session.user.email,
        req,
      });

      // Invalider la session côté serveur si nécessaire
      if (token.jti && typeof token.jti === "string") {
        await invalidateSession(token.jti);
      }
    } catch (error) {
      // Si l'invalidation échoue, on continue quand même
      // car la déconnexion côté client sera effective
      console.warn("Échec de l'invalidation de session:", error);
    }
  }

  // Répondre avec succès même si pas de session (idempotent)
  res.status(200).json({
    success: true,
    message: "Déconnexion réussie",
    timestamp: new Date().toISOString(),
  });
}

export default withErrorHandling(secureSignoutHandler, {
  action: "secure_signout",
});
