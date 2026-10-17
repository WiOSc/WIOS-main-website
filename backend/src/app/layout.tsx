import type { Metadata } from "next";
import {
  Poppins,
  Phetsarath,
  Bebas_Neue,
  Playfair_Display,
  Cedarville_Cursive,
  Playpen_Sans,
} from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const phetsarath = Phetsarath({
  subsets: ["lao"],
  weight: ["400", "700"],
  variable: "--font-phetsarath",
  adjustFontFallback: false,
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const cedarville = Cedarville_Cursive({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cedarville",
});

const playpenSans = Playpen_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-playpen",
});

// Base URL for resolving relative Open Graph / canonical URLs.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WIOS",
  description: "WIOS event platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${phetsarath.variable} ${bebasNeue.variable} ${playfair.variable} ${cedarville.variable} ${playpenSans.variable}`}
    >
      <body className="font-poppins">{children}</body>
    </html>
  );
}
