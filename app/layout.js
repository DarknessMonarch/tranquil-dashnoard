import "@/app/styles/global.css";
import { Toaster } from "sonner";
import GlobalLoader from "@/app/components/GlobalLoader";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const SITE_URL = "https://dashboard.tranquil.com";

export const viewport = {
  themeColor: "#6FAD42",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Tranquil Dashboard",
    template: "%s | Tranquil Dashboard",
  },
  applicationName: "Tranquil Property Management",
  description:
    "Tranquil Property Management Dashboard - Manage properties, tenants, bills, and maintenance requests with ease. Modern property management solution for landlords and property managers.",
  referrer: "origin-when-cross-origin",
  creator: "Tranquil",
  publisher: "Tranquil",


  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: "",
    yandex: "",
  },

  alternates: {
    canonical: `${SITE_URL}`,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${inter.className}`}
      >

        <Toaster
          position="top-center"
          richColors={true}
          toastOptions={{
            style: {
              background: "#6FAD42",
              color: "#ffffff",
              borderRadius: "15px",
              border: "1px solid #6FAD42",
            },
          }}
        />
        <GlobalLoader />
        {children}
      </body>
    </html>
  );
}
