import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback } from "react";
// import { useRouter } from "next/router"; // Unused for now

interface UseSessionManagementOptions {
  redirectOnExpiry?: boolean;
  checkInterval?: number; // en millisecondes
  onSessionExpired?: () => void;
  onSessionInvalid?: () => void;
}

export function useSessionManagement(
  options: UseSessionManagementOptions = {}
) {
  const {
    redirectOnExpiry = true,
    checkInterval = 5 * 60 * 1000, // 5 minutes par défaut
    onSessionExpired,
    onSessionInvalid,
  } = options;

  const { data: session, status } = useSession();
  // const router = useRouter(); // Commented out as it's not used currently

  // Fonction pour vérifier la validité de la session côté serveur
  const validateSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/validate-session");
      const data = await response.json();

      if (!data.valid) {
        console.warn("Session invalide:", data.reason);

        if (data.reason === "expired") {
          onSessionExpired?.();
          if (redirectOnExpiry) {
            await signOut({ callbackUrl: "/auth/signin" });
          }
        } else {
          onSessionInvalid?.();
          if (redirectOnExpiry) {
            await signOut({ callbackUrl: "/auth/signin" });
          }
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la validation de session:", error);
      return false;
    }
  }, [onSessionExpired, onSessionInvalid, redirectOnExpiry]);

  // Fonction pour déconnexion sécurisée
  const secureSignOut = useCallback(async (callbackUrl?: string) => {
    try {
      // Appeler l'API de déconnexion sécurisée
      await fetch("/api/auth/secure-signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Puis utiliser la déconnexion NextAuth
      await signOut({
        callbackUrl: callbackUrl || "/auth/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion sécurisée:", error);
      // Fallback vers la déconnexion standard
      await signOut({ callbackUrl: callbackUrl || "/auth/signin" });
    }
  }, []);

  // Vérification périodique de la session
  useEffect(() => {
    if (status === "authenticated" && session) {
      const interval = setInterval(validateSession, checkInterval);
      return () => clearInterval(interval);
    }
  }, [status, session, validateSession, checkInterval]);

  // Vérification de l'expiration de la session
  useEffect(() => {
    if (status === "authenticated" && session?.expires) {
      const expiryTime = new Date(session.expires).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // Si la session expire dans moins de 5 minutes, la renouveler
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log("Session proche de l'expiration, renouvellement...");
        validateSession();
      }
    }
  }, [status, session, validateSession]);

  return {
    session,
    status,
    validateSession,
    secureSignOut,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isPublicAgent: session?.user?.isPublicAgent || false,
  };
}
