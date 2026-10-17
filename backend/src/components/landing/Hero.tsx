"use client";

import { motion, type Variants } from "framer-motion";
import HeroLogo from "./HeroLogo";
import ExploreButton from "./ExploreButton";
import HeroMobile from "./HeroMobile";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const globe: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 },
  },
};

export default function Hero() {
  return (
    <>
      {/* Mobile hero (phone / tablet) */}
      <div className="lg:hidden">
        <HeroMobile />
      </div>

      {/* Desktop hero — unchanged */}
      <section
        className="no-select relative hidden min-h-screen w-full overflow-hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: "url(/hero_bg.webp)" }}
      >
        <motion.div
          className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-12 px-10 pt-24 lg:flex-row lg:items-center lg:justify-between"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-10">
            <motion.h1
              variants={item}
              className="max-w-xl text-4xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-5xl"
            >
              Where Innovation
              <br />
              Meets Opportunity
            </motion.h1>

            <motion.div variants={item} className="flex flex-wrap gap-5">
              <ExploreButton variant="solid">Explore WiOS</ExploreButton>
              <ExploreButton variant="ghost">Join the Club</ExploreButton>
            </motion.div>
          </div>

          <motion.div variants={globe}>
            <HeroLogo />
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
