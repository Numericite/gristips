/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSessionManagement } from "../lib/useSessionManagement";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { authOptions } from "./api/auth/[...nextauth]";

interface AdminPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    isPublicAgent: boolean;
    organizational_unit?: string;
  };
}

export default function Admin({ user }: AdminPageProps) {
  const { classes } = useStyles();
  const { secureSignOut, isAuthenticated } = useSessionManagement({
    redirectOnExpiry: true,
    checkInterval: 5 * 60 * 1000, // Vérifier toutes les 5 minutes
    onSessionExpired: () => {
      console.log("Session expirée, redirection vers la page de connexion");
    },
    onSessionInvalid: () => {
      console.log("Session invalide, redirection vers la page de connexion");
    },
  });

  const handleSignOut = () => {
    secureSignOut("/");
  };

  // Si la session n'est pas authentifiée, ne pas afficher le contenu
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Administration - Gristips</title>
        <meta
          name="description"
          content="Interface d'administration Gristips"
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
        id="fr-header-gristips-admin"
        quickAccessItems={[
          {
            iconId: "fr-icon-account-circle-line",
            text: user.name,
            linkProps: {
              href: "#",
            },
          },
          {
            iconId: "fr-icon-logout-box-r-line",
            text: "Se déconnecter",
            buttonProps: {
              onClick: handleSignOut,
            },
          },
        ]}
        serviceTitle="Gristips"
        serviceTagline="Automatisations avancées pour vos documents Grist"
      />

      <main className={classes.main}>
        <div className="fr-container">
          {/* Section titre */}
          <div className="fr-grid-row fr-mb-6w">
            <div className="fr-col-12">
              <h1 className="fr-h1">Administration</h1>
              <p className="fr-text--lead">
                Bienvenue dans votre espace d'administration Gristips
              </p>
            </div>
          </div>

          {/* Informations utilisateur */}
          <div className="fr-grid-row fr-grid-row--gutters fr-mb-6w">
            <div className="fr-col-12 fr-col-lg-8">
              <Card
                background
                border
                title="Informations de votre compte"
                desc="Détails de votre profil ProConnect"
                start={
                  <div className={classes.cardIcon}>
                    <i className={fr.cx("fr-icon-account-circle-line")} />
                  </div>
                }
                footer={
                  <div className={classes.userInfo}>
                    <div className={classes.userInfoRow}>
                      <strong>Nom&nbsp;:</strong>
                      <span>{user.name}</span>
                    </div>
                    <div className={classes.userInfoRow}>
                      <strong>Email&nbsp;:</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className={classes.userInfoRow}>
                      <strong>Statut&nbsp;:</strong>
                      <Badge
                        severity={user.isPublicAgent ? "success" : "error"}
                        small
                      >
                        {user.isPublicAgent
                          ? "Agent public"
                          : "Non-agent public"}
                      </Badge>
                    </div>
                    {user.organizational_unit && (
                      <div className={classes.userInfoRow}>
                        <strong>Organisation&nbsp;:</strong>
                        <span>{user.organizational_unit}</span>
                      </div>
                    )}
                    <div className={classes.userInfoRow}>
                      <strong>ID utilisateur&nbsp;:</strong>
                      <span className={classes.userId}>{user.id}</span>
                    </div>
                  </div>
                }
              />
            </div>

            <div className="fr-col-12 fr-col-lg-4">
              <Card
                background
                border
                title="Actions rapides"
                desc="Gérez votre compte et vos paramètres"
                start={
                  <div className={classes.cardIcon}>
                    <i className={fr.cx("fr-icon-settings-5-line")} />
                  </div>
                }
                footer={
                  <div className={classes.actionButtons}>
                    <Button
                      priority="secondary"
                      size="small"
                      iconId="fr-icon-refresh-line"
                      onClick={() => window.location.reload()}
                    >
                      Actualiser les données
                    </Button>
                    <Button
                      priority="secondary"
                      size="small"
                      iconId="fr-icon-logout-box-r-line"
                      onClick={handleSignOut}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                }
              />
            </div>
          </div>

          {/* Section fonctionnalités à venir */}
          <div className="fr-grid-row fr-mb-6w">
            <div className="fr-col-12">
              <h2 className="fr-h3 fr-mb-4w">Fonctionnalités disponibles</h2>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                  <Card
                    background
                    border
                    title="Automatisations Grist"
                    desc="Créez et gérez vos automatisations de documents Grist"
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("fr-icon-refresh-line")} />
                      </div>
                    }
                    footer={
                      <div className={classes.comingSoon}>
                        <Badge severity="info" small>
                          Bientôt disponible
                        </Badge>
                      </div>
                    }
                  />
                </div>

                <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                  <Card
                    background
                    border
                    title="Workflows personnalisés"
                    desc="Configurez des workflows complexes avec conditions et transformations"
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("fr-icon-settings-5-line")} />
                      </div>
                    }
                    footer={
                      <div className={classes.comingSoon}>
                        <Badge severity="info" small>
                          Bientôt disponible
                        </Badge>
                      </div>
                    }
                  />
                </div>

                <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                  <Card
                    background
                    border
                    title="Intégrations API"
                    desc="Connectez vos documents Grist avec d'autres services"
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("fr-icon-links-line")} />
                      </div>
                    }
                    footer={
                      <div className={classes.comingSoon}>
                        <Badge severity="info" small>
                          Bientôt disponible
                        </Badge>
                      </div>
                    }
                  />
                </div>

                <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                  <Card
                    background
                    border
                    title="Configuration ProConnect"
                    desc="Vérifiez la configuration et la connectivité ProConnect"
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("fr-icon-settings-5-line")} />
                      </div>
                    }
                    footer={
                      <div style={{ marginTop: fr.spacing("3w") }}>
                        <Button
                          priority="secondary"
                          size="small"
                          iconId="fr-icon-external-link-line"
                          linkProps={{
                            href: "/admin/config-check",
                          }}
                        >
                          Vérifier la configuration
                        </Button>
                      </div>
                    }
                  />
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

const useStyles = tss.withName("AdminPage").create(() => ({
  main: {
    minHeight: "calc(100vh - 200px)",
    paddingTop: fr.spacing("4w"),
    paddingBottom: fr.spacing("8w"),
  },

  cardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "3rem",
    height: "3rem",
    borderRadius: "50%",
    backgroundColor:
      fr.colors.decisions.background.actionHigh.blueFrance.default,
    color: fr.colors.decisions.text.inverted.grey.default,

    "& i": {
      fontSize: "1.5rem",

      "&::before": {
        "--icon-size": "1.5rem",
      },
    },
  },

  userInfo: {
    marginTop: fr.spacing("3w"),
  },

  userInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${fr.spacing("2w")} 0`,
    borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,

    "&:last-child": {
      borderBottom: "none",
    },

    "& strong": {
      color: fr.colors.decisions.text.title.grey.default,
      minWidth: "120px",
    },

    "& span": {
      color: fr.colors.decisions.text.default.grey.default,
      textAlign: "right",
      flex: 1,
    },
  },

  userId: {
    fontFamily: "monospace",
    fontSize: "0.875rem",
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    padding: `${fr.spacing("1v")} ${fr.spacing("1w")}`,
    borderRadius: fr.spacing("1v"),
  },

  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("2w"),
    marginTop: fr.spacing("3w"),
  },

  comingSoon: {
    marginTop: fr.spacing("3w"),
    textAlign: "center",
  },
}));

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Vérifier si l'utilisateur est connecté
  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  // Vérifier si l'utilisateur est un agent public
  if (!session.user.isPublicAgent) {
    return {
      redirect: {
        destination: "/auth/access-denied",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isPublicAgent: session.user.isPublicAgent,
        organizational_unit: session.user.organizational_unit || null,
      },
    },
  };
};
