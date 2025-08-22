// Hook personnalisé pour la gestion des erreurs d'authentification
export function getAuthErrorMessage(error: string): string {
  switch (error) {
    case "Configuration":
      return "Erreur de configuration ProConnect. Veuillez contacter l'administrateur.";
    case "AccessDenied":
      return "Accès refusé. Seuls les agents publics peuvent accéder à cette application.";
    case "Verification":
      return "Erreur de vérification. Veuillez réessayer.";
    case "Default":
    default:
      return "Une erreur d'authentification s'est produite. Veuillez réessayer.";
  }
}
