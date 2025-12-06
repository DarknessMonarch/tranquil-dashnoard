"use client";

import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import LoadingLogo from "@/app/components/LoadingLogo";

export default function App() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/authentication/login');
  }, [router]);

  return (
    <>
      <Head>
        <title>SportyPredict </title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://dashboard.tranquil.com/authentication/login" />
      </Head>

      <Script id="http-redirect" strategy="beforeInteractive">
        {`
          // This helps search engines understand the redirect better
          if (navigator.userAgent.indexOf('Googlebot') === -1 && 
              navigator.userAgent.indexOf('bot') === -1 && 
              navigator.userAgent.indexOf('Bingbot') === -1) {
            window.location.replace('/authentication/login');
          }
        `}
      </Script>

       <div className="loadingAppMain">
        <LoadingLogo />
      </div>
    </>
  );
}