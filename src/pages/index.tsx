import Head from "next/head";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { tss } from "tss-react/dsfr";
import {
  HeroSection,
  ProblemSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
} from "../components/home";

const useStyles = tss.withName("HomePage").create(() => ({
  main: {
    minHeight: "calc(100vh - 200px)",
  },
}));

export default function Home() {
  const { classes } = useStyles();

  return (
    <>
      <Head>
        <title>Gristips - Automatisations pour Grist</title>
        <meta
          name="description"
          content="Plateforme d'automatisation pour vos documents Grist"
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
        id="fr-header-gristips"
        quickAccessItems={[
          {
            iconId: "fr-icon-lock-line",
            linkProps: {
              href: "/auth/signin",
            },
            text: "Se connecter",
          },
        ]}
        serviceTitle="Gristips"
        serviceTagline="Automatisations avancées pour vos documents Grist"
      />

      <main className={classes.main}>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
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
