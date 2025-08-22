import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
// import { Button } from "@codegouvfr/react-dsfr/Button"; // Not needed with modal buttons
import { useSessionManagement } from "./useSessionManagement";

interface SessionTimeoutWarningProps {
  warningTimeBeforeExpiry?: number; // en millisecondes
}

const sessionTimeoutModal = createModal({
  id: "session-timeout-modal",
  isOpenedByDefault: false,
});

export function SessionTimeoutWarning({
  warningTimeBeforeExpiry = 5 * 60 * 1000, // 5 minutes par défaut
}: SessionTimeoutWarningProps) {
  const { data: session } = useSession();
  const { secureSignOut, validateSession } = useSessionManagement();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session?.expires) return;

    const checkSessionExpiry = () => {
      const expiryTime = new Date(session.expires).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      if (timeUntilExpiry <= warningTimeBeforeExpiry && timeUntilExpiry > 0) {
        setTimeLeft(Math.floor(timeUntilExpiry / 1000));
        sessionTimeoutModal.open();
      } else if (timeUntilExpiry <= 0) {
        // Session expirée
        sessionTimeoutModal.close();
        secureSignOut("/auth/signin");
      } else {
        sessionTimeoutModal.close();
      }
    };

    // Vérifier immédiatement
    checkSessionExpiry();

    // Puis vérifier toutes les 30 secondes
    const interval = setInterval(checkSessionExpiry, 30000);

    return () => clearInterval(interval);
  }, [session?.expires, warningTimeBeforeExpiry, secureSignOut]);

  // Mettre à jour le temps restant toutes les secondes quand l'avertissement est affiché
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          sessionTimeoutModal.close();
          secureSignOut("/auth/signin");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, secureSignOut]);

  const handleExtendSession = async () => {
    try {
      const isValid = await validateSession();
      if (isValid) {
        sessionTimeoutModal.close();
        // Forcer un rechargement de la session
        window.location.reload();
      } else {
        secureSignOut("/auth/signin");
      }
    } catch (error) {
      console.error("Erreur lors de l'extension de session:", error);
      secureSignOut("/auth/signin");
    }
  };

  const handleSignOut = () => {
    sessionTimeoutModal.close();
    secureSignOut("/auth/signin");
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <sessionTimeoutModal.Component
      title="Session sur le point d'expirer"
      iconId="fr-icon-time-line"
      size="small"
      buttons={[
        {
          priority: "primary",
          onClick: handleExtendSession,
          iconId: "fr-icon-refresh-line",
          children: "Prolonger la session",
        },
        {
          priority: "secondary",
          onClick: handleSignOut,
          iconId: "fr-icon-logout-box-r-line",
          children: "Se déconnecter",
        },
      ]}
    >
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <p>
          Votre session va expirer dans{" "}
          <strong style={{ color: "#e1000f" }}>{formatTime(timeLeft)}</strong>.
        </p>
        <p>
          Souhaitez-vous prolonger votre session ou vous déconnecter maintenant
          ?
        </p>
      </div>
    </sessionTimeoutModal.Component>
  );
}
