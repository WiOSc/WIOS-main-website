"use client";

import { motion } from "framer-motion";
import HeroLogo from "./HeroLogo";
import ExploreButton from "./ExploreButton";

export default function HeroMobile() {
  return (
    <section
      className="no-select relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-cover bg-center px-6 pb-10 pt-24"
      style={{ backgroundImage: "url(/hero_bg.webp)" }}
    >
      {/* Globe — same artwork, scaled down and centered */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <HeroLogo scale={0.62} offset={false} />
        </motion.div>
      </div>

      {/* Buttons pinned to the bottom */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="flex flex-col items-center justify-center gap-4"
      >
        <ExploreButton variant="solid">Explore WiOS</ExploreButton>
        <ExploreButton variant="ghost">Join the Club</ExploreButton>
      </motion.div>
    </section>
  );
}
