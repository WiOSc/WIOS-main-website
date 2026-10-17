import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import AboutVitAp from "@/components/landing/AboutVitAp";
import AboutWios from "@/components/landing/AboutWios";
import EventsSection from "@/components/landing/EventsSection";

const TITLE = "WiOS | VIT-AP";
const DESCRIPTION =
  "Women in Open Source (WiOS), VIT-AP. Promoting gender diversity in tech through open-source learning, workshops, hackathons and bootcamps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "WiOS VIT-AP",
    images: [{ url: "/wios-globe-logo.png", alt: "WiOS — VIT-AP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/wios-globe-logo.png"],
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AboutVitAp />
      <AboutWios />
      <EventsSection />
    </>
  );
}
