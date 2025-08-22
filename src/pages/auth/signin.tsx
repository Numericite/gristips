/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { ProConnectButton } from "@codegouvfr/react-dsfr/ProConnectButton";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { authOptions } from "../api/auth/[...nextauth]";

interface SignInPageProps {
  error?: string;
}

export default function SignIn({ error }: SignInPageProps) {
  const { classes } = useStyles();

  const handleProConnectSignIn = () => {
    signIn("proconnect", { callbackUrl: "/admin" });
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "Erreur de configuration du service d'authentification. Veuillez contacter l'administrateur.";
      case "AccessDenied":
        return "Accès refusé. Vous devez être un agent public pour accéder à ce service.";
      case "Verification":
        return "Erreur lors de la vérification de votre identité. Veuillez réessayer.";
      case "Default":
      default:
        return "Une erreur s'est produite lors de la connexion. Veuillez réessayer.";
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - Gristips</title>
        <meta
          name="description"
          content="Connectez-vous à Gristips avec ProConnect"
        />
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
        id="fr-header-gristips-signin"
        serviceTitle="Gristips"
        serviceTagline="Automatisations avancées pour vos documents Grist"
      />

      <main className={classes.main}>
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
              <div className={classes.signInCard}>
                <h1 className="fr-h2 fr-mb-4w">Connexion à Gristips</h1>

                <p className="fr-text--lg fr-mb-4w">
                  Connectez-vous avec ProConnect pour accéder à votre espace
                  d&apos;administration.
                </p>

                {error && (
                  <Alert
                    severity="error"
                    title="Erreur de connexion"
                    description={getErrorMessage(error)}
                    className="fr-mb-4w"
                  />
                )}

                <div className={classes.buttonContainer}>
                  <ProConnectButton
                    onClick={handleProConnectSignIn}
                    className={classes.proConnectButton}
                  />
                </div>

                <div className={classes.infoSection}>
                  <h2 className="fr-h6 fr-mb-2w">Qui peut se connecter ?</h2>
                  <p className="fr-text--sm">
                    Ce service est réservé aux agents publics. Vous devez
                    disposer d'un compte ProConnect pour vous authentifier.
                  </p>

                  <h2 className="fr-h6 fr-mb-2w fr-mt-4w">
                    Qu'est-ce que ProConnect ?
                  </h2>
                  <p className="fr-text--sm">
                    ProConnect est le service d'authentification de l'État
                    français qui permet aux agents publics de se connecter de
                    manière sécurisée aux services numériques de
                    l'administration.
                  </p>
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

const useStyles = tss.withName("SignInPage").create(() => ({
  main: {
    minHeight: "calc(100vh - 200px)",
    paddingTop: fr.spacing("8w"),
    paddingBottom: fr.spacing("8w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
  },

  signInCard: {
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    padding: fr.spacing("6w"),
    borderRadius: fr.spacing("1w"),
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.05), 0 -1px 0 rgba(0, 0, 0, 0.02)",
    textAlign: "center",
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: fr.spacing("6w"),
  },

  proConnectButton: {
    // Le composant ProConnect a ses propres styles
  },

  infoSection: {
    textAlign: "left",
    borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    paddingTop: fr.spacing("4w"),

    "& h2": {
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p": {
      color: fr.colors.decisions.text.default.grey.default,
      lineHeight: "1.5",
    },
  },
}));

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Si l'utilisateur est déjà connecté, rediriger selon son statut
  if (session?.user) {
    if (session.user.isPublicAgent) {
      return {
        redirect: {
          destination: "/admin",
          permanent: false,
        },
      };
    } else {
      return {
        redirect: {
          destination: "/auth/access-denied",
          permanent: false,
        },
      };
    }
  }

  const error = context.query.error as string | undefined;

  return {
    props: {
      error: error ?? null,
    },
  };
};
