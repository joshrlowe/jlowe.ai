import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import styles from "@/styles/Layout.module.css";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Josh Lowe</title>
      </Head>
      <Header />
      <div className={styles.contentWrapper}>
        <main className={`${styles.main} darkBackground`}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
