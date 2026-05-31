import type { Metadata } from "next";

export const siteConfig = {
  name: "Connect",
  title: "Connect - Real-time Chat and Video Calls",
  description:
    "Connect is a real-time messaging platform for private chats, group conversations, and video calls.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5173",
};

export const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  siteName: siteConfig.name,
  title: siteConfig.title,
  description: siteConfig.description,
  url: siteConfig.url,
  images: [
    {
      url: "/unnamed.png",
      width: 1200,
      height: 630,
      alt: `${siteConfig.name} app preview`,
    },
  ],
};

export const privatePageRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};
