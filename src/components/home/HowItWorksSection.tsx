import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const useStyles = tss.withName("HowItWorksSection").create(() => ({
  howItWorksSection: {
    padding: `${fr.spacing("8w")} 0`,
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
  },

  stepCard: {
    textAlign: "center",
    padding: fr.spacing("4w"),
  },

  stepNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "3rem",
    height: "3rem",
    borderRadius: "50%",
    backgroundColor:
      fr.colors.decisions.background.actionHigh.blueFrance.default,
    color: fr.colors.decisions.text.inverted.grey.default,
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: fr.spacing("2w"),
  },
}));

export function HowItWorksSection() {
  const { classes } = useStyles();

  return (
    <section className={classes.howItWorksSection}>
      <div className="fr-container">
        <div className="fr-grid-row fr-mb-6w">
          <div className="fr-col-12">
            <h2 className="fr-h2">Comment ça fonctionne</h2>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <div className={classes.stepCard}>
              <div className={classes.stepNumber}>1</div>
              <h3 className="fr-h5">Connectez votre API Grist</h3>
              <p>
                Saisissez votre clé API Grist pour accéder à vos documents. Nous
                récupérons automatiquement la liste de vos documents
                disponibles.
              </p>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className={classes.stepCard}>
              <div className={classes.stepNumber}>2</div>
              <h3 className="fr-h5">Configurez vos workflows</h3>
              <p>
                Définissez vos automatisations : source, destination, fréquence,
                conditions et transformations de données.
              </p>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className={classes.stepCard}>
              <div className={classes.stepNumber}>3</div>
              <h3 className="fr-h5">Laissez la magie opérer</h3>
              <p>
                Vos automatisations s'exécutent selon la planification définie.
                Suivez leur statut et leurs résultats en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
