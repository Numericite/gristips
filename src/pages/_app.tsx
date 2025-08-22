import type { AppProps } from "next/app";
import { createNextDsfrIntegrationApi } from "@codegouvfr/react-dsfr/next-pagesdir";
import Link from "next/link";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { SessionProvider } from "next-auth/react";
import createEmotionCache from "@/lib/createEmotionCache";
import { SessionTimeoutWarning } from "@/lib/SessionTimeoutWarning";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

// Only in TypeScript projects
declare module "@codegouvfr/react-dsfr/next-pagesdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: "system",
  Link,
  preloadFonts: ["Marianne-Regular", "Marianne-Medium", "Marianne-Bold"],
});

export { dsfrDocumentApi };

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

function App({
  Component,
  pageProps: { session, ...pageProps },
  emotionCache = clientSideEmotionCache,
}: MyAppProps) {
  return (
    <CacheProvider value={emotionCache}>
      <SessionProvider session={session}>
        <ErrorBoundary>
          <Component {...pageProps} />
          <SessionTimeoutWarning warningTimeBeforeExpiry={5 * 60 * 1000} />
        </ErrorBoundary>
      </SessionProvider>
    </CacheProvider>
  );
}

export default withDsfr(App);
