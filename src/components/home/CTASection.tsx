import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const useStyles = tss.withName("CTASection").create(() => ({
  ctaSection: {
    padding: `${fr.spacing("8w")} 0`,
    backgroundColor:
      fr.colors.decisions.background.actionLow.blueFrance.default,
  },

  ctaContent: {
    textAlign: "center",
  },
}));

export function CTASection() {
  const { classes } = useStyles();

  return (
    <section className={classes.ctaSection}>
      <div className="fr-container">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <div className={classes.ctaContent}>
              <h2 className="fr-h2 fr-mb-2w">
                Prêt à automatiser vos workflows Grist ?
              </h2>
              <p className="fr-text--lg fr-mb-4w">
                Commencez dès maintenant et gagnez du temps sur vos tâches
                répétitives.
              </p>
              <div className="fr-btns-group fr-btns-group--center">
                <Button
                  priority="primary"
                  size="small"
                  linkProps={{ href: "/auth/signin" }}
                >
                  Se connecter avec ProConnect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
