import type { Metadata } from "next";

const TITLE = "Events | WiOS";
const DESCRIPTION =
  "Explore events by Women in Open Source (WiOS), VIT-AP. Workshops, hackathons, bootcamps and speaker sessions across the years.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/events",
    siteName: "WiOS VIT-AP",
    images: [{ url: "/wios-globe-logo.png", alt: "WiOS Events" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/wios-globe-logo.png"],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
