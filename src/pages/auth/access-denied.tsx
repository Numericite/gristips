/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { authOptions } from "../api/auth/[...nextauth]";

interface AccessDeniedPageProps {
  user?: {
    email: string;
    name: string;
    isPublicAgent: boolean;
  };
}

export default function AccessDenied({ user }: AccessDeniedPageProps) {
  const { classes } = useStyles();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <>
      <Head>
        <title>Accès refusé - Gristips</title>
        <meta
          name="description"
          content="Accès refusé - Service réservé aux agents publics"
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
        id="fr-header-gristips-access-denied"
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

                <h1 className="fr-h2 fr-mb-4w">Accès refusé</h1>

                <Alert
                  severity="error"
                  title="Service réservé aux agents publics"
                  description="Vous n'avez pas l'autorisation d'accéder à ce service."
                  className="fr-mb-4w"
                />

                <div className={classes.explanationSection}>
                  <h2 className="fr-h4 fr-mb-3w">
                    Pourquoi cet accès est-il refusé ?
                  </h2>

                  <p className="fr-text--lg fr-mb-3w">
                    Gristips est un service réservé exclusivement aux agents
                    publics de l'administration française. L'accès est contrôlé
                    via ProConnect, le service d'authentification de l'État.
                  </p>

                  {user && (
                    <CallOut
                      title="Informations de votre compte"
                      iconId="fr-icon-information-line"
                    >
                      <strong>Compte connecté :</strong> {user.name} (
                      {user.email})
                      <br />
                      <strong>Statut :</strong>{" "}
                      {user.isPublicAgent ? "Agent public" : "Non-agent public"}
                      {!user.isPublicAgent && (
                        <>
                          <br />
                          <span className="fr-text--sm fr-mt-2w">
                            Votre compte ProConnect n'indique pas que vous êtes
                            un agent public. Si vous pensez qu'il s'agit d'une
                            erreur, veuillez contacter votre administrateur
                            système ou le support ProConnect.
                          </span>
                        </>
                      )}
                    </CallOut>
                  )}

                  <div className={classes.helpSection}>
                    <h3 className="fr-h6 fr-mb-2w">
                      Que faire si vous êtes un agent public ?
                    </h3>
                    <ul className="fr-mb-3w">
                      <li>
                        Vérifiez que votre compte ProConnect est correctement
                        configuré avec votre statut d'agent public
                      </li>
                      <li>
                        Contactez votre service informatique ou RH pour vérifier
                        vos droits d'accès
                      </li>
                      <li>
                        Si le problème persiste, contactez le support technique
                        de votre organisation
                      </li>
                    </ul>

                    <h3 className="fr-h6 fr-mb-2w">
                      Vous n'êtes pas un agent public ?
                    </h3>
                    <p className="fr-text--sm">
                      Ce service n'est pas accessible aux particuliers ou aux
                      entreprises privées. Il est exclusivement destiné aux
                      agents de la fonction publique française.
                    </p>
                  </div>
                </div>

                <div className={classes.actionButtons}>
                  <Button
                    priority="primary"
                    size="large"
                    iconId="fr-icon-home-4-line"
                    onClick={handleGoHome}
                  >
                    Retour à l'accueil
                  </Button>

                  {user && (
                    <Button
                      priority="secondary"
                      size="large"
                      iconId="fr-icon-logout-box-r-line"
                      onClick={handleSignOut}
                    >
                      Se déconnecter
                    </Button>
                  )}
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

const useStyles = tss.withName("AccessDeniedPage").create(() => ({
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

  explanationSection: {
    textAlign: "left",
    marginBottom: fr.spacing("6w"),

    "& h2, & h3": {
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p, & li": {
      color: fr.colors.decisions.text.default.grey.default,
      lineHeight: "1.6",
    },

    "& ul": {
      paddingLeft: fr.spacing("4w"),
    },

    "& li": {
      marginBottom: fr.spacing("1w"),
    },
  },

  helpSection: {
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    padding: fr.spacing("4w"),
    borderRadius: fr.spacing("1w"),
    marginTop: fr.spacing("4w"),
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
  const session = await getServerSession(context.req, context.res, authOptions);

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  // Si l'utilisateur est un agent public, rediriger vers l'admin
  if (session.user.isPublicAgent) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    };
  }

  // Sinon, afficher la page d'accès refusé avec les informations utilisateur
  return {
    props: {
      user: {
        email: session.user.email,
        name: session.user.name,
        isPublicAgent: session.user.isPublicAgent,
      },
    },
  };
};
