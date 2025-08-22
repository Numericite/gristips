/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useState, useEffect } from "react";
import { useSessionManagement } from "../../lib/useSessionManagement";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { authOptions } from "../api/auth/[...nextauth]";
import {
  GristApiKeyConfig,
  AutomationCreationForm,
  AutomationList,
} from "../../components/admin";

interface AutomationPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    isPublicAgent: boolean;
    organizational_unit?: string;
  };
}

type ViewMode = "overview" | "api-key" | "create" | "list";

interface ApiKeyStatus {
  hasApiKey: boolean;
  isValid?: boolean;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "error";
  sourceDocumentName: string;
  sourceTableName: string;
  targetDocumentName: string;
  targetTableName: string;
  lastExecuted?: string;
  createdAt: string;
}

// Adapter function to convert Automation to AutomationListItem
const adaptAutomationForList = (automation: Automation) => ({
  ...automation,
  type: "table_copy", // Default type for now
  sourceDocumentId: automation.id + "_src_doc", // Placeholder - should come from API
  sourceTableId: automation.id + "_src_table", // Placeholder - should come from API
  targetDocumentId: automation.id + "_tgt_doc", // Placeholder - should come from API
  targetTableId: automation.id + "_tgt_table", // Placeholder - should come from API
  selectedColumns: [], // Placeholder - should come from API
  lastExecutionStatus: automation.status === "error" ? "failed" : "success",
  updatedAt: automation.createdAt, // Placeholder
});

export default function AutomationManagement({ user }: AutomationPageProps) {
  const { classes } = useStyles();
  const [currentView, setCurrentView] = useState<ViewMode>("overview");
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { secureSignOut, isAuthenticated } = useSessionManagement({
    redirectOnExpiry: true,
    checkInterval: 5 * 60 * 1000,
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

  // Check API key status on component mount
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      try {
        const response = await fetch("/api/admin/grist-api-key");
        if (response.ok) {
          const data = await response.json();
          setApiKeyStatus(data);
        } else {
          setError("Erreur lors de la vérification de la clé API");
        }
      } catch (err) {
        setError("Erreur de connexion lors de la vérification de la clé API");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      checkApiKeyStatus();
    }
  }, [isAuthenticated]);

  // Load automations when API key is available
  useEffect(() => {
    const loadAutomations = async () => {
      if (!apiKeyStatus?.hasApiKey) return;

      try {
        const response = await fetch("/api/admin/automations");
        if (response.ok) {
          const data = await response.json();
          setAutomations(data.automations || []);
        } else {
          setError("Erreur lors du chargement des automatisations");
        }
      } catch (err) {
        setError("Erreur de connexion lors du chargement des automatisations");
      }
    };

    loadAutomations();
  }, [apiKeyStatus]);

  const handleAutomationCreate = async (automationData: {
    name: string;
    description?: string;
    sourceDocumentId: string;
    sourceTableId: string;
    targetDocumentId: string;
    targetTableId: string;
    selectedColumns: string[];
  }) => {
    try {
      const response = await fetch("/api/admin/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(automationData),
      });

      if (response.ok) {
        const newAutomation = await response.json();
        setAutomations([...automations, newAutomation]);
        setCurrentView("list");
        setError(null);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Erreur lors de la création de l'automatisation"
        );
      }
    } catch (err) {
      setError("Erreur de connexion lors de la création de l'automatisation");
    }
  };

  const handleAutomationDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/automations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAutomations(automations.filter((a) => a.id !== id));
        setError(null);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Erreur lors de la suppression de l'automatisation"
        );
      }
    } catch (err) {
      setError(
        "Erreur de connexion lors de la suppression de l'automatisation"
      );
    }
  };

  const handleAutomationEdit = (id: string) => {
    // For now, just show an alert - editing functionality would be implemented later
    alert(`Édition de l'automatisation ${id} - Fonctionnalité à venir`);
  };

  const handleAutomationToggle = async (
    id: string,
    status: "active" | "inactive"
  ) => {
    try {
      const response = await fetch(`/api/admin/automations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedAutomation = await response.json();
        setAutomations(
          automations.map((a) => (a.id === id ? updatedAutomation : a))
        );
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (err) {
      setError("Erreur de connexion lors de la mise à jour du statut");
    }
  };

  // Si la session n'est pas authentifiée, ne pas afficher le contenu
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-text--center fr-mt-8w">
              <p>Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // If no API key is configured, show API key setup
    if (!apiKeyStatus?.hasApiKey && currentView !== "api-key") {
      return (
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-lg-8">
            <Alert
              severity="info"
              title="Configuration requise"
              description="Vous devez d'abord configurer votre clé API Grist pour accéder aux fonctionnalités d'automatisation."
            />
            <div className="fr-mt-4w fr-text--center">
              <Button
                priority="primary"
                iconId="fr-icon-settings-5-line"
                onClick={() => setCurrentView("api-key")}
              >
                Configurer la clé API
              </Button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case "api-key":
        return (
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-lg-8">
              <GristApiKeyConfig
                onApiKeyUpdate={(hasValidKey: boolean) => {
                  if (hasValidKey) {
                    // Reload API key status when a valid key is configured
                    const checkApiKeyStatus = async () => {
                      try {
                        const response = await fetch(
                          "/api/admin/grist-api-key"
                        );
                        if (response.ok) {
                          const data = await response.json();
                          setApiKeyStatus(data);
                          setCurrentView("overview");
                        }
                      } catch (err) {
                        setError(
                          "Erreur lors de la vérification de la clé API"
                        );
                      }
                    };
                    checkApiKeyStatus();
                  }
                }}
              />
            </div>
          </div>
        );

      case "create":
        return (
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-lg-10">
              <Card
                background
                border
                title="Créer une nouvelle automatisation"
                desc="Configurez une automatisation de copie de table entre vos documents Grist"
                footer={
                  <AutomationCreationForm
                    onSubmit={handleAutomationCreate}
                    onCancel={() => setCurrentView("overview")}
                  />
                }
              />
            </div>
          </div>
        );

      case "list":
        return (
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <div className="fr-mb-4w">
                <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                  <div className="fr-col">
                    <h2 className="fr-h3 fr-mb-0">Mes automatisations</h2>
                  </div>
                  <div className="fr-col-auto">
                    <Button
                      priority="primary"
                      iconId="fr-icon-add-line"
                      onClick={() => setCurrentView("create")}
                    >
                      Nouvelle automatisation
                    </Button>
                  </div>
                </div>
              </div>
              <AutomationList
                automations={automations.map(adaptAutomationForList)}
                onEdit={handleAutomationEdit}
                onDelete={handleAutomationDelete}
                onToggleStatus={handleAutomationToggle}
              />
            </div>
          </div>
        );

      default: // overview
        return (
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-lg-8">
              <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
                <div className="fr-col-12 fr-col-md-6">
                  <Card
                    background
                    border
                    title="Clé API Grist"
                    desc="Configuration de votre accès aux documents Grist"
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("ri-key-2-line")} />
                      </div>
                    }
                    footer={
                      <div className={classes.cardFooter}>
                        <div className="fr-mb-2w">
                          <Badge
                            severity={
                              apiKeyStatus?.hasApiKey ? "success" : "warning"
                            }
                            small
                          >
                            {apiKeyStatus?.hasApiKey
                              ? "Configurée"
                              : "Non configurée"}
                          </Badge>
                        </div>
                        <Button
                          priority="secondary"
                          size="small"
                          iconId="fr-icon-settings-5-line"
                          onClick={() => setCurrentView("api-key")}
                        >
                          {apiKeyStatus?.hasApiKey ? "Modifier" : "Configurer"}
                        </Button>
                      </div>
                    }
                  />
                </div>

                <div className="fr-col-12 fr-col-md-6">
                  <Card
                    background
                    border
                    title="Automatisations"
                    desc={`${automations.length} automatisation${
                      automations.length !== 1 ? "s" : ""
                    } configurée${automations.length !== 1 ? "s" : ""}`}
                    start={
                      <div className={classes.cardIcon}>
                        <i className={fr.cx("fr-icon-refresh-line")} />
                      </div>
                    }
                    footer={
                      <div className={classes.cardFooter}>
                        <div className="fr-mb-2w">
                          <Badge severity="info" small>
                            {
                              automations.filter((a) => a.status === "active")
                                .length
                            }{" "}
                            active
                            {automations.filter((a) => a.status === "active")
                              .length !== 1
                              ? "s"
                              : ""}
                          </Badge>
                        </div>
                        <div className={classes.actionButtons}>
                          <Button
                            priority="primary"
                            size="small"
                            iconId="fr-icon-add-line"
                            onClick={() => setCurrentView("create")}
                            disabled={!apiKeyStatus?.hasApiKey}
                          >
                            Créer
                          </Button>
                          <Button
                            priority="secondary"
                            size="small"
                            iconId="fr-icon-list-unordered"
                            onClick={() => setCurrentView("list")}
                            disabled={automations.length === 0}
                          >
                            Voir tout
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </div>
              </div>

              {automations.length > 0 && (
                <Card
                  background
                  border
                  title="Automatisations récentes"
                  desc="Vos dernières automatisations configurées"
                  footer={
                    <div>
                      <AutomationList
                        automations={automations
                          .slice(0, 3)
                          .map(adaptAutomationForList)}
                        onEdit={handleAutomationEdit}
                        onDelete={handleAutomationDelete}
                        onToggleStatus={handleAutomationToggle}
                        compact
                      />
                      {automations.length > 3 && (
                        <div className="fr-mt-4w fr-text--center">
                          <Button
                            priority="tertiary no outline"
                            iconId="fr-icon-arrow-right-line"
                            iconPosition="right"
                            onClick={() => setCurrentView("list")}
                          >
                            Voir toutes les automatisations (
                            {automations.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  }
                />
              )}
            </div>

            <div className="fr-col-12 fr-col-lg-4">
              <Card
                background
                border
                title="Guide de démarrage"
                desc="Étapes pour configurer vos premières automatisations"
                start={
                  <div className={classes.cardIcon}>
                    <i className={fr.cx("fr-icon-information-line")} />
                  </div>
                }
                footer={
                  <div className={classes.guideSteps}>
                    <div className={classes.step}>
                      <div className={classes.stepNumber}>
                        <Badge
                          severity={
                            apiKeyStatus?.hasApiKey ? "success" : "info"
                          }
                          small
                        >
                          1
                        </Badge>
                      </div>
                      <div className={classes.stepContent}>
                        <strong>Configurer la clé API</strong>
                        <p>
                          Ajoutez votre clé API Grist pour accéder à vos
                          documents
                        </p>
                      </div>
                    </div>
                    <div className={classes.step}>
                      <div className={classes.stepNumber}>
                        <Badge
                          severity={automations.length > 0 ? "success" : "info"}
                          small
                        >
                          2
                        </Badge>
                      </div>
                      <div className={classes.stepContent}>
                        <strong>Créer une automatisation</strong>
                        <p>
                          Configurez votre première copie de table automatique
                        </p>
                      </div>
                    </div>
                    <div className={classes.step}>
                      <div className={classes.stepNumber}>
                        <Badge severity="info" small>
                          3
                        </Badge>
                      </div>
                      <div className={classes.stepContent}>
                        <strong>Surveiller l'exécution</strong>
                        <p>
                          Suivez le statut et les résultats de vos
                          automatisations
                        </p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Automatisations Grist - Gristips</title>
        <meta
          name="description"
          content="Gérez vos automatisations de documents Grist"
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
        id="fr-header-gristips-automations"
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
          <Breadcrumb
            currentPageLabel={
              currentView === "overview"
                ? "Automatisations"
                : currentView === "api-key"
                ? "Configuration API"
                : currentView === "create"
                ? "Nouvelle automatisation"
                : "Liste des automatisations"
            }
            homeLinkProps={{
              href: "/",
            }}
            segments={[
              {
                label: "Administration",
                linkProps: {
                  href: "/admin",
                },
              },
            ]}
          />

          <div className="fr-grid-row fr-mb-6w">
            <div className="fr-col-12">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h1 className="fr-h1 fr-mb-0">
                    {currentView === "overview"
                      ? "Automatisations Grist"
                      : currentView === "api-key"
                      ? "Configuration de la clé API"
                      : currentView === "create"
                      ? "Nouvelle automatisation"
                      : "Mes automatisations"}
                  </h1>
                  <p className="fr-text--lead fr-mb-0">
                    {currentView === "overview"
                      ? "Créez et gérez vos automatisations de documents Grist"
                      : currentView === "api-key"
                      ? "Configurez votre accès aux documents Grist"
                      : currentView === "create"
                      ? "Configurez une nouvelle automatisation de copie de table"
                      : "Gérez toutes vos automatisations configurées"}
                  </p>
                </div>
                {currentView !== "overview" && (
                  <div className="fr-col-auto">
                    <Button
                      priority="tertiary no outline"
                      iconId="fr-icon-arrow-left-line"
                      onClick={() => setCurrentView("overview")}
                    >
                      Retour
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="fr-grid-row fr-mb-4w">
              <div className="fr-col-12">
                <Alert
                  severity="error"
                  title="Erreur"
                  description={error}
                  closable
                  onClose={() => setError(null)}
                />
              </div>
            </div>
          )}

          {renderContent()}
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

const useStyles = tss.withName("AutomationManagementPage").create(() => ({
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

  cardFooter: {
    marginTop: fr.spacing("3w"),
  },

  actionButtons: {
    display: "flex",
    gap: fr.spacing("2w"),
    flexWrap: "wrap",
  },

  guideSteps: {
    marginTop: fr.spacing("3w"),
  },

  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: fr.spacing("3w"),
    marginBottom: fr.spacing("4w"),

    "&:last-child": {
      marginBottom: 0,
    },
  },

  stepNumber: {
    flexShrink: 0,
  },

  stepContent: {
    flex: 1,

    "& strong": {
      display: "block",
      marginBottom: fr.spacing("1w"),
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p": {
      margin: 0,
      fontSize: "0.875rem",
      color: fr.colors.decisions.text.default.grey.default,
    },
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
