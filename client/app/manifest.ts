import type { MetadataRoute } from "next";

import { siteConfig } from "./seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/auth",
    display: "standalone",
    background_color: "#0f0f1a",
    theme_color: "#0068ff",
    icons: [
      {
        src: "/unnamed.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
