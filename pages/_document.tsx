import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon set — generated from public/images/logo.png (glowing JL on
            black). The .ico carries 16/32/48 and doubles as the legacy
            fallback; PNG links cover pixel-exact sizes. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#bb1313" />
        <meta name="msapplication-TileColor" content="#bb1313" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </Head>
      <body suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
