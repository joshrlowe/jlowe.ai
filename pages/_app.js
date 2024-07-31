import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Projects - My Portfolio</title>
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
