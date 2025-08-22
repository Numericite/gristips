// Configuration des durées de session
export const SESSION_CONFIG = {
  // Durée maximale d'une session (30 jours)
  maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
  // Fréquence de mise à jour de la session (1 jour)
  updateAge: 24 * 60 * 60, // 1 jour en secondes
  // Durée d'inactivité avant expiration (2 heures)
  inactivityTimeout: 2 * 60 * 60, // 2 heures en secondes
} as const;
