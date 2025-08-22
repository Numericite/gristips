/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

interface AuthErrorPageProps {
  error: string;
}

export default function AuthError({ error }: AuthErrorPageProps) {
  const { classes } = useStyles();

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case "Configuration":
        return {
          title: "Erreur de configuration",
          description:
            "Le service d'authentification n'est pas correctement configuré. Veuillez contacter l'administrateur système.",
          severity: "error" as const,
        };
      case "AccessDenied":
        return {
          title: "Accès refusé",
          description:
            "Vous n'avez pas l'autorisation d'accéder à ce service. Seuls les agents publics peuvent se connecter.",
          severity: "error" as const,
        };
      case "Verification":
        return {
          title: "Erreur de vérification",
          description:
            "Impossible de vérifier votre identité. Veuillez réessayer ou contacter le support.",
          severity: "error" as const,
        };
      case "OAuthSignin":
        return {
          title: "Erreur de connexion ProConnect",
          description:
            "Une erreur s'est produite lors de la connexion avec ProConnect. Veuillez réessayer.",
          severity: "error" as const,
        };
      case "OAuthCallback":
        return {
          title: "Erreur de callback ProConnect",
          description:
            "Une erreur s'est produite lors du retour de ProConnect. Veuillez réessayer la connexion.",
          severity: "error" as const,
        };
      case "OAuthCreateAccount":
        return {
          title: "Erreur de création de compte",
          description:
            "Impossible de créer votre compte. Veuillez réessayer ou contacter le support.",
          severity: "error" as const,
        };
      case "EmailCreateAccount":
        return {
          title: "Erreur d'email",
          description:
            "L'adresse email fournie par ProConnect n'est pas valide.",
          severity: "error" as const,
        };
      case "Callback":
        return {
          title: "Erreur de callback",
          description:
            "Une erreur s'est produite lors du processus d'authentification.",
          severity: "error" as const,
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Compte non lié",
          description:
            "Ce compte ProConnect n'est pas lié à un compte utilisateur existant.",
          severity: "warning" as const,
        };
      case "EmailSignin":
        return {
          title: "Erreur d'authentification par email",
          description:
            "L'authentification par email n'est pas disponible. Utilisez ProConnect pour vous connecter.",
          severity: "info" as const,
        };
      case "CredentialsSignin":
        return {
          title: "Identifiants incorrects",
          description: "Les identifiants fournis sont incorrects.",
          severity: "error" as const,
        };
      case "SessionRequired":
        return {
          title: "Session requise",
          description: "Vous devez être connecté pour accéder à cette page.",
          severity: "info" as const,
        };
      default:
        return {
          title: "Erreur d'authentification",
          description:
            "Une erreur inattendue s'est produite lors de l'authentification. Veuillez réessayer.",
          severity: "error" as const,
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  const handleRetrySignIn = () => {
    window.location.href = "/auth/signin";
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <>
      <Head>
        <title>Erreur d'authentification - Gristips</title>
        <meta name="description" content="Erreur lors de l'authentification" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        homeLinkProps={{
          href: "/",
          title: "Accueil - Gristips",
        }}
        id="fr-header-gristips-auth-error"
        serviceTitle="Gristips"
        serviceTagline="Automatisations avancées pour vos documents Grist"
      />

      <main className={classes.main}>
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-10 fr-col-lg-8">
              <div className={classes.errorCard}>
                <div className={classes.iconContainer}>
                  <i className={fr.cx("fr-icon-error-warning-line")} />
                </div>

                <h1 className="fr-h2 fr-mb-4w">Erreur d'authentification</h1>

                <Alert
                  severity={errorDetails.severity}
                  title={errorDetails.title}
                  description={errorDetails.description}
                  className="fr-mb-6w"
                />

                <div className={classes.helpSection}>
                  <h2 className="fr-h4 fr-mb-3w">Que faire ?</h2>

                  <div className={classes.suggestions}>
                    <h3 className="fr-h6 fr-mb-2w">Solutions recommandées :</h3>
                    <ul className="fr-mb-4w">
                      <li>
                        Réessayez de vous connecter en cliquant sur "Réessayer
                        la connexion"
                      </li>
                      <li>
                        Vérifiez que vous utilisez un compte ProConnect valide
                      </li>
                      <li>
                        Assurez-vous que votre compte ProConnect indique bien
                        votre statut d'agent public
                      </li>
                      <li>
                        Si le problème persiste, contactez votre administrateur
                        système
                      </li>
                    </ul>

                    <h3 className="fr-h6 fr-mb-2w">
                      Informations techniques :
                    </h3>
                    <div className={classes.technicalInfo}>
                      <p>
                        <strong>Code d'erreur :</strong> {error}
                      </p>
                      <p>
                        <strong>Service :</strong> ProConnect Authentication
                      </p>
                      <p>
                        <strong>Timestamp :</strong>{" "}
                        {new Date().toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={classes.actionButtons}>
                  <Button
                    priority="primary"
                    size="large"
                    iconId="fr-icon-refresh-line"
                    onClick={handleRetrySignIn}
                  >
                    Réessayer la connexion
                  </Button>

                  <Button
                    priority="secondary"
                    size="large"
                    iconId="fr-icon-home-4-line"
                    onClick={handleGoHome}
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        accessibility="fully compliant"
        contentDescription="Gristips - Plateforme d'automatisation pour vos documents Grist"
        homeLinkProps={{
          href: "/",
          title: "Accueil - Gristips",
        }}
        termsLinkProps={{
          href: "/mentions-legales",
        }}
        bottomItems={[headerFooterDisplayItem]}
      />
    </>
  );
}

const useStyles = tss.withName("AuthErrorPage").create(() => ({
  main: {
    minHeight: "calc(100vh - 200px)",
    paddingTop: fr.spacing("8w"),
    paddingBottom: fr.spacing("8w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
  },

  errorCard: {
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    padding: fr.spacing("6w"),
    borderRadius: fr.spacing("1w"),
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.05), 0 -1px 0 rgba(0, 0, 0, 0.02)",
    textAlign: "center",
  },

  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: fr.spacing("4w"),

    "& i": {
      fontSize: "4rem",
      color: fr.colors.decisions.background.flat.error.default,

      "&::before": {
        "--icon-size": "4rem",
      },
    },
  },

  helpSection: {
    textAlign: "left",
    marginBottom: fr.spacing("6w"),

    "& h2, & h3": {
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p, & li": {
      color: fr.colors.decisions.text.default.grey.default,
      lineHeight: "1.6",
    },
  },

  suggestions: {
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    padding: fr.spacing("4w"),
    borderRadius: fr.spacing("1w"),

    "& ul": {
      paddingLeft: fr.spacing("4w"),
    },

    "& li": {
      marginBottom: fr.spacing("1w"),
    },
  },

  technicalInfo: {
    backgroundColor: fr.colors.decisions.background.contrast.grey.default,
    padding: fr.spacing("3w"),
    borderRadius: fr.spacing("1v"),
    fontFamily: "monospace",
    fontSize: "0.875rem",

    "& p": {
      margin: `${fr.spacing("1w")} 0`,
      color: fr.colors.decisions.text.default.grey.default,
    },

    "& strong": {
      color: fr.colors.decisions.text.title.grey.default,
    },
  },

  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("3w"),
    alignItems: "center",

    [fr.breakpoints.up("md")]: {
      flexDirection: "row",
      justifyContent: "center",
    },
  },
}));

export const getServerSideProps: GetServerSideProps = async (context) => {
  const error = (context.query.error as string) || "Default";

  return {
    props: {
      error,
    },
  };
};
