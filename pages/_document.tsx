/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, @next/next/no-html-link-for-pages, no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
