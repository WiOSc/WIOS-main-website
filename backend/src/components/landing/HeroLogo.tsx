import Image from "next/image";

const RING_1_D =
  "M458.425 8.51659C482.121 21.0986 494.737 35.5576 494.895 50.3145C495.054 65.0714 482.748 79.5587 459.322 92.1941C435.896 104.83 402.251 115.127 362.062 121.962C321.872 128.797 276.684 131.907 231.432 130.952C186.18 129.997 142.605 125.014 105.466 116.546C68.3265 108.079 39.0512 96.4531 20.8374 82.9388C2.62363 69.4244 -3.82827 54.5412 2.18638 39.9146C8.20103 25.2879 26.4509 11.4804 54.9429 -3.93484e-07L62.4662 1.97731C35.0878 13.009 17.5511 26.277 11.7715 40.332C5.99189 54.387 12.1917 68.6885 29.6936 81.6747C47.1956 94.6609 75.3268 105.832 111.015 113.969C146.703 122.105 188.575 126.894 232.058 127.812C275.541 128.73 318.964 125.741 357.582 119.173C396.201 112.605 428.531 102.71 451.042 90.5684C473.552 78.4268 485.377 64.5057 485.225 50.3255C485.073 36.1453 472.95 22.2513 450.18 10.1611L458.425 8.51659Z";
const RING_2_D =
  "M450.166 -1.39216e-06C476.333 11.9706 491.894 26.035 495.162 40.6686C498.431 55.3022 489.281 69.9467 468.706 83.0146C448.131 96.0825 416.916 107.075 378.443 114.801C339.971 122.527 295.71 126.691 250.457 126.842C205.205 126.993 160.689 123.125 121.734 115.658C82.7789 108.191 50.8717 97.4087 29.4711 84.481C8.07052 71.5533 -2.00695 56.9729 0.331152 42.3206C2.66925 27.6683 17.3337 13.5029 42.7349 1.3602L50.7531 3.12326C26.3447 14.7914 12.2533 28.4032 10.0066 42.4829C7.75985 56.5626 17.4435 70.5731 38.0077 82.9956C58.572 95.4181 89.2322 105.779 126.665 112.954C164.097 120.13 206.874 123.846 250.358 123.701C293.841 123.556 336.373 119.554 373.342 112.131C410.311 104.707 440.306 94.1437 460.077 81.5865C479.848 69.0294 488.64 54.9572 485.499 40.8955C482.359 26.8337 467.406 13.319 442.261 1.81622L450.166 -1.39216e-06Z";

function Ring({
  id,
  d,
  w,
  h,
  delay,
}: {
  id: string;
  d: string;
  w: number;
  h: number;
  delay: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 block h-auto w-full"
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={d} fill="#ffffff" fillOpacity="0.1" />

      <g clipPath={`url(#${id}-clip)`}>
        <rect
          x="0"
          y="0"
          width={w}
          height={h}
          fill={`url(#${id}-grad)`}
          style={{
            // @ts-expect-error CSS custom property
            "--rw": `${w}px`,
            animation: `ring-pulse 4s linear infinite`,
            animationDelay: delay,
          }}
        />
      </g>
    </svg>
  );
}

export default function HeroLogo({
  scale = 1.3,
  offset = true,
}: {
  scale?: number;
  offset?: boolean;
} = {}) {
  const SCALE = scale;
  return (
    <div
      className={`relative shrink-0 ${offset ? "translate-x-20" : ""}`}
      style={{ width: 553 * SCALE, height: 412 * SCALE }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: 553, height: 412, transform: `scale(${SCALE})` }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: 71.18,
            top: 0,
            width: 398.375,
            height: 394.958,
            background: "rgba(129, 110, 183, 0.20)",
          }}
        />

        <div
          className="absolute flex items-center justify-center"
          style={{ left: 39.96, top: 29.17, width: 513.038, height: 382.968 }}
        >
          <div className="flex-none -scale-y-100 rotate-[150.33deg] skew-x-[1.36deg]">
            <div className="relative h-[161.052px] w-[494.897px]">
              <Ring id="ring1" d={RING_1_D} w={494.897} h={131.121} delay="0s" />
            </div>
          </div>
        </div>

        <div
          className="absolute flex items-center justify-center"
          style={{ left: 0, top: 58.33, width: 520.383, height: 353.657 }}
        >
          <div className="flex-none rotate-[24.99deg] skew-x-[-1.22deg]">
            <div className="relative h-[160.746px] w-[495.81px]">
              <Ring id="ring2" d={RING_2_D} w={495.81} h={126.846} delay="2s" />
            </div>
          </div>
        </div>

        <Image
          src="/wios-globe-logo.png"
          alt="WIOS VIT-AP"
          width={312}
          height={289}
          priority
          className="absolute"
          style={{ left: 114.14, top: 57, width: 311.526, height: 289.186 }}
        />

        <img
          src="/star.svg"
          alt=""
          className="absolute"
          style={{ left: 485, top: 96, width: 48, height: 71 }}
        />
        <img
          src="/star.svg"
          alt=""
          className="absolute"
          style={{ left: 71, top: 197, width: 48, height: 71 }}
        />
      </div>
    </div>
  );
}
