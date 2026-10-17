import Image from "next/image";
import Reveal from "./Reveal";

const STAGE_W = 801;
const STAGE_H = 732;
const EXTRA_TILT = -10;

export default function AboutVitAp() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative mx-auto flex min-h-[680px] max-w-[1512px] items-center py-20 max-lg:min-h-0 max-lg:flex-col max-lg:gap-10 max-lg:py-14">
        <Reveal className="relative z-10 max-w-[680px] px-8 sm:px-16 lg:pl-[66px]">
          <h2 className="font-bebas text-[44px] leading-[0.95] text-black sm:text-[60px] lg:text-[76px]">
            ABOUT
            <br />
            VIT -AP
          </h2>

          <p className="mt-4 text-[22px] leading-none text-black sm:text-[28px] lg:text-[34px]">
            <span className="font-playfair">An University built for </span>
            <span className="font-cedarville">whats next.</span>
          </p>

          <p className="mt-8 max-w-[560px] font-playfair text-[20px] leading-relaxed text-black sm:text-[26px] lg:text-[32px]">
            Vellore Institute of Technology, Andhra Pradesh (VIT-AP) University is
            a state private university located in Amaravati, the capital of Andhra
            Pradesh, India.
          </p>

          <a
            href="http://vitap.ac.in/"
            target="_blank"
            rel="noreferrer"
            className="mt-12 inline-flex items-center gap-4 rounded-[25px] bg-[#7186C7] py-[14px] pl-[24px] pr-[24px] font-poppins text-[16px] text-white"
          >
            DISCOVER VIT-AP
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>

        <div
          className="pointer-events-none hidden [container-type:inline-size] lg:absolute lg:right-0 lg:top-1/2 lg:block lg:w-[clamp(390px,49vw,850px)] lg:-translate-y-1/2 lg:translate-x-[25%]"
          style={{
            aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(calc(100cqw / ${STAGE_W}))`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `rotate(${EXTRA_TILT}deg)` }}
            >
              <div
                className="absolute left-0 top-0 flex items-center justify-center"
                style={{ width: STAGE_W, height: STAGE_H }}
              >
                <div className="flex-none rotate-[38.36deg]">
                  <div
                    className="rounded-[170px] bg-[#4B5FA8]"
                    style={{ width: 756.219, height: 335.206 }}
                  />
                </div>
              </div>

              <div
                className="absolute flex items-center justify-center"
                style={{ left: 83.8, top: 84.8, width: 300.934, height: 300.932 }}
              >
                <div
                  className="flex-none"
                  style={{ transform: `rotate(${-EXTRA_TILT}deg)` }}
                >
                  <div className="relative h-[293.677px] w-[293.68px] overflow-hidden rounded-full">
                    <Image
                      src="/vitap.png"
                      alt="VIT-AP campus"
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
