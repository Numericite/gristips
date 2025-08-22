import { Card } from "@codegouvfr/react-dsfr/Card";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const useStyles = tss.withName("FeaturesSection").create(() => ({
  featuresSection: {
    padding: `${fr.spacing("8w")} 0`,
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
}));

export function FeaturesSection() {
  const { classes } = useStyles();

  return (
    <section id="features" className={classes.featuresSection}>
      <div className="fr-container">
        <div className="fr-grid-row fr-mb-6w">
          <div className="fr-col-12">
            <h2 className="fr-h2">Ce que Gristips vous apporte</h2>
            <p className="fr-text--lg">
              Une suite d'outils d'automatisation conçus spécifiquement pour
              Grist
            </p>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <Card
              background
              border
              enlargeLink
              linkProps={{ href: "#sync" }}
              title="Synchronisation périodique"
              desc="Copiez automatiquement des données entre vos documents Grist selon une fréquence définie (quotidienne, hebdomadaire, mensuelle)."
              start={
                <div className={classes.cardIcon}>
                  <i className={fr.cx("fr-icon-refresh-line")} />
                </div>
              }
            />
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <Card
              background
              border
              enlargeLink
              linkProps={{ href: "#workflows" }}
              title="Workflows personnalisés"
              desc="Créez des automatisations complexes avec des conditions, des transformations de données et des actions multiples."
              start={
                <div className={classes.cardIcon}>
                  <i className={fr.cx("fr-icon-settings-5-line")} />
                </div>
              }
            />
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <Card
              background
              border
              enlargeLink
              linkProps={{ href: "#api" }}
              title="Intégration API simple"
              desc="Connectez vos documents Grist en quelques clics grâce à votre clé API. Configuration sécurisée et intuitive."
              start={
                <div className={classes.cardIcon}>
                  <i className={fr.cx("fr-icon-links-line")} />
                </div>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
