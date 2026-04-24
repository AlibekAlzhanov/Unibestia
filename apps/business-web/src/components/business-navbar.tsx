"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { type JSX } from "react";

const links = [
  { href: "/", label: "Портал" },
  { href: "/staff", label: "Staff QR" },
  { href: "/admin", label: "Admin" },
];

export function BusinessNavbar(): JSX.Element {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17384B] text-lg font-black text-white">
            UB
          </div>
          <div>
            <p className="text-base font-black text-[#17384B]">UniBestia</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
              Business
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-2xl px-4 py-2 text-sm font-bold transition",
                  isActive
                    ? "bg-[#17384B] text-white"
                    : "text-[#526470] hover:bg-[#F6F8F7] hover:text-[#17384B]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <SignedIn>
          <UserButton afterSignOutUrl="/login" />
        </SignedIn>
      </div>
    </header>
  );
}
