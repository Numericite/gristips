import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const useStyles = tss.withName("HeroSection").create(() => ({
  heroSection: {
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    padding: `${fr.spacing("8w")} 0`,
  },

  heroTitle: {
    fontSize: "3rem",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: fr.spacing("4w"),

    [fr.breakpoints.down("md")]: {
      fontSize: "2.5rem",
    },
  },
}));

export function HeroSection() {
  const { classes } = useStyles();

  return (
    <section className={classes.heroSection}>
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10 fr-col-lg-8">
            <h1 className={classes.heroTitle}>
              Automatisez vos workflows Grist
            </h1>
            <p className="fr-text--lead fr-mb-4w">
              Gristips vous permet de créer des automatisations puissantes pour
              vos documents Grist : synchronisation de données, copies
              périodiques, et bien plus encore.
            </p>
            <div className="fr-btns-group fr-btns-group--center">
              <Button
                priority="primary"
                size="small"
                linkProps={{ href: "/auth/signin" }}
              >
                Se connecter avec ProConnect
              </Button>
              <Button
                priority="secondary"
                size="small"
                linkProps={{ href: "#features" }}
              >
                Découvrir les fonctionnalités
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
