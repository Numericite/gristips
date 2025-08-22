import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  getProConnectConfig,
  transformProConnectProfile,
  isPublicAgent,
  validateProConnectConfig,
} from "../../../lib/proconnect";
import {
  validateProConnectClaims,
  createUserDataFromProConnect,
  SESSION_CONFIG,
} from "../../../lib/auth";
import { validateConfigurationAtStartup } from "../../../lib/config-validation";
import { logError, logAuthEvent } from "../../../lib/error-handling";

// Validation complète des variables d'environnement au démarrage
// Ne pas valider pendant le build
const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build" ||
  process.argv.includes("build");

if (!isBuildTime) {
  validateProConnectConfig();
  validateConfigurationAtStartup();
}

const prisma = new PrismaClient();
const proConnectConfig = getProConnectConfig();

// ProConnect Provider using the working configuration approach
const ProConnectProvider = {
  id: "proconnect",
  name: "ProConnect",
  type: "oauth" as const,
  issuer: `https://${process.env.PROCONNECT_DOMAIN}/api/v2`,
  wellKnown: `https://${process.env.PROCONNECT_DOMAIN}/api/v2/.well-known/openid-configuration`,
  authorization: {
    url: `https://${process.env.PROCONNECT_DOMAIN}/api/v2/authorize`,
    params: {
      scope:
        "openid email given_name usual_name organizational_unit belonging_population",
    },
  },
  token: `https://${process.env.PROCONNECT_DOMAIN}/api/v2/token`,
  userinfo: `https://${process.env.PROCONNECT_DOMAIN}/api/v2/userinfo`,
  clientId: proConnectConfig.clientId,
  clientSecret: proConnectConfig.clientSecret,
  idToken: true,
  checks: ["nonce", "state"],

  // Mapping des claims ProConnect vers le profil utilisateur
  profile(profile: any) {
    console.log("🔍 Profile reçu de ProConnect:", profile);

    // Handle JWT token response if needed
    let actualProfile = profile;
    if (typeof profile === "string") {
      try {
        actualProfile = jwt.decode(profile) as any;
      } catch (error) {
        console.error("Failed to decode JWT profile:", error);
        actualProfile = profile;
      }
    }

    const transformedProfile = transformProConnectProfile(actualProfile);
    console.log("🔄 Profil transformé:", transformedProfile);

    return {
      id: transformedProfile.sub,
      email: transformedProfile.email,
      name: `${transformedProfile.given_name} ${transformedProfile.usual_name}`,
      given_name: transformedProfile.given_name,
      usual_name: transformedProfile.usual_name,
      organizational_unit: transformedProfile.organizational_unit,
      belonging_population: transformedProfile.belonging_population,
      // Vérification du statut d'agent public via le claim belonging_population
      isPublicAgent: isPublicAgent(transformedProfile.belonging_population),
    };
  },
} as any;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [ProConnectProvider],

  callbacks: {
    // Callback signIn pour gérer la logique d'authentification ProConnect
    async signIn({ user, account, profile }) {
      if (account?.provider === "proconnect") {
        try {
          console.log("🔍 SignIn callback - Profile:", profile);
          console.log("🔍 SignIn callback - Account:", account);

          // Vérifier que le profil existe
          if (!profile) {
            console.error("❌ Profil ProConnect manquant");
            return false;
          }

          // Si le profil ne contient pas les informations utilisateur,
          // les récupérer via l'endpoint userinfo
          let enrichedProfile = profile;
          if (!profile.email || !profile.given_name) {
            console.log(
              "📡 Récupération des informations utilisateur via /userinfo..."
            );

            try {
              const userinfoResponse = await fetch(
                `https://${process.env.PROCONNECT_DOMAIN}/api/v2/userinfo`,
                {
                  headers: {
                    Authorization: `Bearer ${account.access_token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (!userinfoResponse.ok) {
                throw new Error(`Erreur userinfo: ${userinfoResponse.status}`);
              }

              const userinfoText = await userinfoResponse.text();
              console.log(
                "📄 Réponse userinfo brute:",
                userinfoText.substring(0, 100) + "..."
              );

              let userinfo;
              try {
                // Essayer de parser comme JSON d'abord
                userinfo = JSON.parse(userinfoText);
              } catch {
                // Si ce n'est pas du JSON, c'est probablement un JWT
                console.log("🔓 Décodage du JWT userinfo...");
                try {
                  userinfo = jwt.decode(userinfoText) as any;
                  if (!userinfo) {
                    throw new Error("JWT userinfo invalide");
                  }
                } catch (jwtError) {
                  console.error("❌ Erreur décodage JWT:", jwtError);
                  throw new Error(
                    "Impossible de décoder les informations utilisateur"
                  );
                }
              }

              console.log("✅ Informations utilisateur récupérées:", userinfo);

              // Fusionner les informations du token ID et de userinfo
              enrichedProfile = { ...profile, ...userinfo };

              // Mettre à jour l'objet user avec les nouvelles informations
              user.email = userinfo.email || user.email;
              user.name =
                `${userinfo.given_name || ""} ${
                  userinfo.usual_name || ""
                }`.trim() || user.name;

              // Vérifier qu'on a au moins un email
              if (!user.email) {
                console.error(
                  "❌ Aucun email trouvé dans le profil utilisateur"
                );
                throw new Error("Email manquant dans le profil ProConnect");
              }
            } catch (error) {
              console.error(
                "❌ Erreur lors de la récupération des informations utilisateur:",
                error
              );
              // Continuer avec le profil existant
            }
          }

          // Valider les claims ProConnect requis
          if (!validateProConnectClaims(enrichedProfile)) {
            logError(new Error("Claims ProConnect invalides"), {
              email: user.email,
              action: "proconnect_signin",
            });

            logAuthEvent("signin_failed", {
              email: user.email,
              provider: "proconnect",
              reason: "invalid_claims",
            });

            return false;
          }

          // Mettre à jour les informations utilisateur avec les données ProConnect
          const transformedProfile =
            transformProConnectProfile(enrichedProfile);
          // Temporairement, tous les utilisateurs ProConnect sont considérés comme agents publics
          const isAgent = true; // TODO: Utiliser isPublicAgent(transformedProfile.belonging_population) plus tard

          // Mettre à jour l'objet user avec les données ProConnect
          user.isPublicAgent = isAgent;
          user.organizational_unit = transformedProfile.organizational_unit;
          user.given_name = transformedProfile.given_name;
          user.usual_name = transformedProfile.usual_name;
          user.belonging_population = transformedProfile.belonging_population;

          // Vérifier si l'utilisateur existe déjà et lier le compte si nécessaire
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              include: { accounts: true },
            });

            if (existingUser) {
              console.log(
                "👤 Utilisateur existant trouvé:",
                existingUser.email
              );

              // Vérifier si le compte ProConnect est déjà lié
              const existingAccount = existingUser.accounts.find(
                (acc) =>
                  acc.provider === "proconnect" &&
                  acc.providerAccountId === account.providerAccountId
              );

              if (!existingAccount) {
                console.log(
                  "🔗 Liaison du compte ProConnect à l'utilisateur existant..."
                );

                // Mettre à jour les informations utilisateur
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: user.name,
                    isPublicAgent: isAgent,
                    organization:
                      transformedProfile.organizational_unit || null,
                  },
                });

                console.log(
                  "✅ Utilisateur mis à jour avec les données ProConnect"
                );
              }
            }
          } catch (error) {
            console.error("❌ Erreur lors de la liaison du compte:", error);
            // Continuer même en cas d'erreur
          }

          console.log("✅ Utilisateur enrichi avec les données ProConnect:", {
            email: user.email,
            name: user.name,
            isPublicAgent: isAgent,
          });

          // Log de la connexion réussie pour audit
          logAuthEvent("signin_success", {
            userId: user.id,
            email: user.email,
            isPublicAgent: isAgent,
            provider: "proconnect",
          });

          return true;
        } catch (error) {
          logError(error, {
            email: user.email,
            action: "proconnect_signin",
          });

          logAuthEvent("signin_failed", {
            email: user.email,
            provider: "proconnect",
            reason: "signin_error",
          });

          return false;
        }
      }

      return true;
    },

    // Callback JWT pour traiter les claims ProConnect
    async jwt({ token, account, profile, user }) {
      // Lors de la première connexion avec ProConnect
      if (account?.provider === "proconnect" && profile) {
        console.log("🔑 JWT callback - Sauvegarde des données ProConnect");

        // Si le profil ne contient pas les informations utilisateur,
        // les récupérer via l'endpoint userinfo
        let enrichedProfile = profile;
        if (!profile.email || !profile.given_name) {
          console.log(
            "📡 JWT callback - Récupération des informations utilisateur via /userinfo..."
          );

          try {
            const userinfoResponse = await fetch(
              `https://${process.env.PROCONNECT_DOMAIN}/api/v2/userinfo`,
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  Accept: "application/json",
                },
              }
            );

            if (userinfoResponse.ok) {
              const userinfoText = await userinfoResponse.text();

              let userinfo;
              try {
                userinfo = JSON.parse(userinfoText);
              } catch {
                // Si ce n'est pas du JSON, c'est probablement un JWT
                const jwt = await import("jsonwebtoken");
                userinfo = jwt.decode(userinfoText) as any;
              }

              if (userinfo) {
                enrichedProfile = { ...profile, ...userinfo };
                console.log(
                  "✅ JWT callback - Informations utilisateur récupérées"
                );
              }
            }
          } catch (error) {
            console.error(
              "❌ JWT callback - Erreur récupération userinfo:",
              error
            );
          }
        }

        const transformedProfile = transformProConnectProfile(enrichedProfile);
        // Temporairement, tous les utilisateurs ProConnect sont considérés comme agents publics
        token.isPublicAgent = true; // TODO: Utiliser isPublicAgent(transformedProfile.belonging_population) plus tard
        token.organizational_unit = transformedProfile.organizational_unit;
        token.belonging_population = transformedProfile.belonging_population;
        token.given_name = transformedProfile.given_name;
        token.usual_name = transformedProfile.usual_name;
        token.email = transformedProfile.email;
      }

      // Conserver les informations utilisateur dans le token pour les requêtes suivantes
      if (user) {
        token.isPublicAgent = user.isPublicAgent;
        token.organizational_unit = user.organizational_unit;
      }

      return token;
    },

    // Callback session pour exposer les données utilisateur transformées
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.isPublicAgent = token.isPublicAgent as boolean;
        session.user.organizational_unit = token.organizational_unit as string;

        // Vérifier l'expiration de la session
        const now = Math.floor(Date.now() / 1000);
        const sessionExpiry = Math.floor(
          new Date(session.expires).getTime() / 1000
        );

        // Si la session expire dans moins d'une heure, la renouveler
        if (sessionExpiry - now < 3600) {
          session.expires = new Date(
            Date.now() + SESSION_CONFIG.maxAge * 1000
          ).toISOString();
        }
      }
      return session;
    },

    // Callback de redirection selon le statut d'agent public
    async redirect({ url, baseUrl }) {
      // Si l'URL contient déjà une destination, l'utiliser
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Sinon, rediriger vers l'URL de base
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_CONFIG.maxAge,
    updateAge: SESSION_CONFIG.updateAge,
  },

  // Configuration de sécurité renforcée
  secret: process.env.NEXTAUTH_SECRET,

  // Configuration des cookies sécurisés
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Événements pour le logging avec système d'erreur structuré
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "proconnect") {
        logAuthEvent("signin_success", {
          userId: user.id,
          email: user.email,
          provider: "proconnect",
          isPublicAgent: user.isPublicAgent,
        });
      }
    },
    async signOut({ session, token }) {
      logAuthEvent("signout", {
        userId: session?.user?.id || token?.sub,
        email: session?.user?.email || token?.email || undefined,
      });
    },
    async session({ session }) {
      // Log des accès pour audit en développement seulement
      if (process.env.NODE_ENV === "development") {
        console.log(`[SESSION] Active pour: ${session.user.email}`);
      }
    },
  },

  // Configuration debug pour le développement
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
