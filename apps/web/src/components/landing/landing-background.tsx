
import { type JSX, type ReactNode } from "react";

export function LandingBackground({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-[#F7F6F1]">
      {/* Base soft gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_14%_10%,rgba(166,239,238,0.32),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(255,166,159,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(247,246,241,0.30)_100%)]" />
      <div className="pointer-events-none absolute left-[-110px] top-[120px] -z-10 h-[260px] w-[260px] rounded-full bg-[#DDF7F3] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[420px] -z-10 h-[300px] w-[300px] rounded-full bg-[#FFE9E2] blur-3xl" />
      <div className="pointer-events-none absolute left-[6%] top-[1080px] -z-10 h-[260px] w-[260px] rounded-full bg-[#EAF5E6] blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[1700px] -z-10 h-[280px] w-[280px] rounded-full bg-[#E4F2F9] blur-3xl" />

      {/* Wave 1 */}
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

      {/* Wave 2 */}
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

      {/* Bottom light fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[360px] bg-[radial-gradient(circle_at_18%_72%,rgba(166,239,238,0.14),transparent_22%),radial-gradient(circle_at_80%_76%,rgba(255,166,159,0.12),transparent_20%),linear-gradient(180deg,rgba(247,246,241,0)_0%,rgba(255,255,255,0.58)_100%)]" />

      {children}
    </div>
  );
}
