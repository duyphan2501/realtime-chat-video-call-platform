import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins, Outfit, Barlow_Condensed } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ContextProvider } from "@/context/MyContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { defaultOpenGraph, siteConfig } from "./seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-outfit",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "real-time chat",
    "video calls",
    "messaging app",
    "group chat",
    "WebRTC",
    "Socket.IO",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: defaultOpenGraph,
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/unnamed.png"],
  },
  icons: {
    icon: "/unnamed.png",
    apple: "/unnamed.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
        ${inter.variable}
        ${poppins.variable}
        ${outfit.variable}
        ${barlow.variable}
        bg-background!
      `}
      >
        <QueryProvider>
          <ContextProvider>
            {children}
            <Toaster position="top-center" reverseOrder={false} />
          </ContextProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
