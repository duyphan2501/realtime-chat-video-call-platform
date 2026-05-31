import "../globals.css";
import type { Metadata } from "next";
import { defaultOpenGraph, siteConfig } from "../seo";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Connect to continue your chats, group conversations, and video calls.",
  alternates: {
    canonical: "/auth",
  },
  openGraph: {
    ...defaultOpenGraph,
    title: `Sign in to ${siteConfig.name}`,
    url: "/auth",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`min-h-screen `}>{children}</div>;
}
