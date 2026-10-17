import Image from "next/image";
import Reveal from "./Reveal";

const STAGE_W = 801;
const STAGE_H = 732;
const EXTRA_TILT = -10;
const CAPSULE_COLOR = "#8D7FB5";

export default function AboutWios() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative mx-auto flex min-h-[680px] max-w-[1512px] items-center py-20 max-lg:min-h-0 max-lg:flex-col max-lg:gap-10 max-lg:py-14">
        <div
          className="pointer-events-none hidden [container-type:inline-size] lg:absolute lg:left-0 lg:top-1/2 lg:block lg:w-[clamp(390px,49vw,850px)] lg:-translate-x-[32%] lg:-translate-y-1/2"
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
              style={{ transform: `scaleX(-1) rotate(${EXTRA_TILT}deg)` }}
            >
              <div
                className="absolute left-0 top-0 flex items-center justify-center"
                style={{ width: STAGE_W, height: STAGE_H }}
              >
                <div className="flex-none rotate-[38.36deg]">
                  <div
                    className="rounded-[182px]"
                    style={{
                      width: 816.72,
                      height: 362.02,
                      background: CAPSULE_COLOR,
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute flex items-center justify-center"
                style={{ left: 83.8, top: 84.8, width: 300.934, height: 300.932 }}
              >
                <div
                  className="flex-none"
                  style={{ transform: `rotate(${-EXTRA_TILT}deg) scaleX(-1)` }}
                >
                  <div className="relative h-[293.677px] w-[293.68px] overflow-hidden rounded-full">
                    <Image
                      src="/logo.png"
                      alt="WIOS logo"
                      fill
                      className="object-contain p-6"
                      sizes="300px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Reveal className="relative z-10 ml-auto max-w-[680px] px-8 sm:px-16 lg:pr-[66px]">
          <h2 className="font-bebas text-[40px] leading-[0.95] text-black sm:text-[52px] lg:text-[60px]">
            ABOUT WIOS
          </h2>

          <p className="mt-4 text-[20px] leading-none text-black sm:text-[24px] lg:text-[28px]">
            <span className="font-playfair">Promoting </span>
            <span className="font-cedarville text-[#5369B5]">gender diversity</span>
            <span className="font-playfair"> in tech.</span>
          </p>

          <p className="mt-8 max-w-[560px] font-playfair text-[19px] leading-relaxed text-black sm:text-[25px] lg:text-[30px]">
            WIOS (Women in Open Source) empowers students through open-source
            learning, workshops, hackathons and technical bootcamps. We foster
            an inclusive community where students can develop skills in AI, Development,
            Machine Learning, Data Analytics and other emerging technologies.
          </p>

          <a
            href="#"
            className="mt-12 inline-flex items-center gap-4 rounded-[25px] py-[14px] pl-[24px] pr-[24px] font-poppins text-[16px] text-white"
            style={{ background: CAPSULE_COLOR }}
          >
            DISCOVER WIOS
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
      </div>
    </section>
  );
}
