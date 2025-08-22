import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const useStyles = tss.withName("ProblemSection").create(() => ({
  problemSection: {
    padding: `${fr.spacing("6w")} 0`,
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
  },
}));

export function ProblemSection() {
  const { classes } = useStyles();

  return (
    <section className={classes.problemSection}>
      <div className="fr-container">
        <CallOut
          title="Le défi actuel avec Grist"
          iconId="fr-icon-error-warning-line"
        >
          Grist est un excellent outil de gestion de données, mais il manque de
          fonctionnalités d'automatisation avancées comme la synchronisation
          périodique entre documents ou la copie automatique de tables selon des
          règles personnalisées.
        </CallOut>
      </div>
    </section>
  );
}
