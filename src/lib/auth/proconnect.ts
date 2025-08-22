/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProConnectProfile } from "./types";

// Validation des claims ProConnect
export function validateProConnectClaims(profile: any): boolean {
  const requiredClaims = ["sub", "email", "given_name", "usual_name"];

  for (const claim of requiredClaims) {
    if (!profile[claim]) {
      console.error(`Claim ProConnect manquant: ${claim}`);
      return false;
    }
  }

  // Vérifier que belonging_population est un tableau
  if (
    profile.belonging_population &&
    !Array.isArray(profile.belonging_population)
  ) {
    console.error("belonging_population doit être un tableau");
    return false;
  }

  return true;
}

// Utilitaire pour créer les données utilisateur à partir du profil ProConnect
export function createUserDataFromProConnect(profile: ProConnectProfile) {
  return {
    name: `${profile.given_name} ${profile.usual_name}`,
    isPublicAgent:
      Array.isArray(profile.belonging_population) &&
      profile.belonging_population.includes("agent"),
    organization: profile.organizational_unit || null,
  };
}
