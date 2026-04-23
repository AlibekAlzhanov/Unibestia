import Image from "next/image";
import Link from "next/link";
import { type JSX } from "react";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const widths = {
  sm: 132,
  md: 176,
  lg: 248,
};

export function Logo({
  href = "/",
  size = "md",
  showTagline = false,
}: LogoProps): JSX.Element {
  const width = widths[size];
  const height = Math.round((width * 334) / 1689);

  return (
    <Link href={href} className="inline-flex flex-col gap-2">
      <Image
        src="/branding/unibestie-logo.png"
        alt="UniBestie"
        width={width}
        height={height}
        className="h-auto w-auto"
        priority={size === "lg"}
      />

      {showTagline ? (
        <span
          className="text-sm font-semibold text-[#4F6472]"
          style={{ fontFamily: "Nunito, Inter, sans-serif" }}
        >
          Твой гид по скидкам и выгодным предложениям
        </span>
      ) : null}
    </Link>
  );
}
