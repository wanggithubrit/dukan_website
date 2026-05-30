import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

import BottomNav from "@/components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "MyDukan – Discover Nearby Local Shops",

  description:
    "Discover nearby local shops, products, and offers with Dukan. Explore grocery, fashion, electronics, restaurants, and more near you in Nagaland.",

  metadataBase: new URL("https://mydukan.online"),

  keywords: [
    "mydukan",
    "mydukan",
    "dukan",
    "local shops",
    "Nagaland marketplace",
    "shops near me",
    "hyperlocal shopping",
    "Dimapur shops",
    "Kohima shops",
    "local business app",
  ],

  openGraph: {
    title: "Dukan – Discover Nearby Local Shops",
    description:
      "Explore nearby shops, products, and local offers with Dukan.",
    url: "https://mydukan.online",
    siteName: "Dukan",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Dukan – Discover Nearby Local Shops",
    description:
      "Find nearby local shops, products, and offers with Dukan.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${outfit.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-0">
        <Providers>

          <main className="grow flex flex-col">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
