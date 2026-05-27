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
  title: "Dukand - Local Shops Near You",
  description: "Find and support the best local shops near you. Get instant access to Grocery, Fashion, Electronics, Pharmacy, and Restaurants in your community.",
  metadataBase: new URL('https://dukan-backend-0cc9.onrender.com'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 pb-20 md:pb-0">
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
