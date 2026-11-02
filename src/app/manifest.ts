import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BillBrain - AI Financial Assistant",
    short_name: "BillBrain",
    description: "Understand your bills, control spending, track receipts & automated reports.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
