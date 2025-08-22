import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour l'état pour afficher l'UI de fallback au prochain rendu
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur pour le monitoring
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // En développement, afficher l'erreur dans la console
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 Erreur React capturée par ErrorBoundary:", errorReport);
    }

    // En production, envoyer à un service de monitoring
    // TODO: Intégrer avec un service comme Sentry, LogRocket, etc.
    console.error("Erreur React:", error.message);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback personnalisée
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface de fallback par défaut
      return (
        <div className="fr-container fr-py-4w">
          <Alert
            severity="error"
            title="Une erreur inattendue s'est produite"
            description={
              <div>
                <p>
                  Nous nous excusons pour ce désagrément. Une erreur technique a
                  empêché l&apos;affichage correct de cette page.
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="fr-mt-2w">
                    <summary>Détails techniques (développement)</summary>
                    <pre className="fr-mt-1w" style={{ fontSize: "0.875rem" }}>
                      {this.state.error.message}
                      {this.state.error.stack && (
                        <>
                          {"\n\n"}
                          {this.state.error.stack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
                <div className="fr-btns-group fr-btns-group--inline fr-mt-3w">
                  <Button priority="primary" onClick={this.handleReload}>
                    Recharger la page
                  </Button>
                  <Button priority="secondary" onClick={this.handleGoHome}>
                    Retour à l&apos;accueil
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour capturer les erreurs dans les composants fonctionnels
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // Logger l'erreur
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("🚨 Erreur capturée par useErrorHandler:", errorReport);
    } else {
      console.error("Erreur:", error.message);
    }

    // Relancer l'erreur pour qu'elle soit capturée par ErrorBoundary
    throw error;
  };
}
