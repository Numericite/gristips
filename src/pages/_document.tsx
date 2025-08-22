/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Html,
  Head,
  Main,
  NextScript,
  DocumentProps,
  DocumentContext,
} from "next/document";
import Document from "next/document";
import { dsfrDocumentApi } from "./_app";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "@/lib/createEmotionCache";
import { JSX } from "react";

const { getColorSchemeHtmlAttributes, augmentDocumentForDsfr } =
  dsfrDocumentApi;

export default function MyDocument(
  props: DocumentProps & { emotionStyleTags: JSX.Element[] }
) {
  return (
    <Html {...getColorSchemeHtmlAttributes(props)}>
      <Head>
        <meta name="emotion-insertion-point" content="" />
        {props.emotionStyleTags}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};

augmentDocumentForDsfr(MyDocument);
