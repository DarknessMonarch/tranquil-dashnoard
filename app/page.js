"use client";

import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import styles from "@/app/styles/loader.module.css";

export default function App() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  return (
    <>
      <Head>
        <title>Tranquil Property Management</title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://dashboard.tranquil.com/admin/login" />
      </Head>

      <Script id="http-redirect" strategy="beforeInteractive">
        {`
          // This helps search engines understand the redirect better
          if (navigator.userAgent.indexOf('Googlebot') === -1 &&
              navigator.userAgent.indexOf('bot') === -1 &&
              navigator.userAgent.indexOf('Bingbot') === -1) {
            window.location.replace('/admin/login');
          }
        `}
      </Script>

      <div className={styles.loadingComponent}>
        <div className={styles.loader}></div>
      </div>
    </>
  );
}
