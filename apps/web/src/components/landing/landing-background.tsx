import { type JSX, type ReactNode } from "react";

export function LandingBackground({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-[#F7F6F1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_14%_10%,rgba(166,239,238,0.34),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(255,166,159,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,246,241,0.30)_100%)]" />

      <div className="ub-animate-float pointer-events-none absolute left-[-120px] top-[120px] -z-10 h-[280px] w-[280px] rounded-full bg-[#DDF7F3] blur-3xl" />
      <div className="ub-animate-float pointer-events-none absolute right-[-130px] top-[420px] -z-10 h-[320px] w-[320px] rounded-full bg-[#FFE9E2] blur-3xl" />
      <div className="pointer-events-none absolute left-[6%] top-[1080px] -z-10 h-[280px] w-[280px] rounded-full bg-[#EAF5E6] blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[1700px] -z-10 h-[300px] w-[300px] rounded-full bg-[#E4F2F9] blur-3xl" />

      <div className="pointer-events-none absolute left-[8%] top-[220px] -z-10 hidden h-4 w-4 rounded-full bg-[#FF9F8A]/50 md:block" />
      <div className="pointer-events-none absolute right-[18%] top-[310px] -z-10 hidden h-3 w-3 rounded-full bg-[#A6EFEE]/80 md:block" />
      <div className="pointer-events-none absolute right-[9%] top-[760px] -z-10 hidden h-5 w-5 rounded-full bg-[#BEDD87]/70 lg:block" />

      <div className="pointer-events-none absolute inset-x-0 top-[760px] -z-10 h-[180px] overflow-hidden">
        <svg
          viewBox="0 0 1440 240"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,128 C160,208 320,208 480,152 C640,96 800,40 960,72 C1120,104 1280,184 1440,144 L1440,240 L0,240 Z"
            fill="rgba(255,255,255,0.82)"
          />
          <path
            d="M0,160 C170,88 340,88 520,132 C760,192 1030,224 1440,104 L1440,240 L0,240 Z"
            fill="rgba(255,255,255,0.46)"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[1560px] -z-10 h-[190px] overflow-hidden">
        <svg
          viewBox="0 0 1440 240"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,140 C180,92 360,54 560,94 C760,134 920,214 1110,186 C1260,164 1360,124 1440,90 L1440,240 L0,240 Z"
            fill="rgba(255,255,255,0.78)"
          />
          <path
            d="M0,172 C190,224 382,206 556,160 C760,106 976,56 1440,136 L1440,240 L0,240 Z"
            fill="rgba(255,248,245,0.52)"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_72%,rgba(166,239,238,0.16),transparent_22%),radial-gradient(circle_at_80%_76%,rgba(255,166,159,0.14),transparent_20%),linear-gradient(180deg,rgba(247,246,241,0)_0%,rgba(255,255,255,0.64)_100%)]" />

      {children}
    </div>
  );
}