"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@repo/ui/components/base/button";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { useTRPC } from "@/utils/trpc";

const studentLinks = [
  { href: "/home", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/wallet", label: "Кошелёк" },
  { href: "/my-redemptions", label: "Мои скидки" },
  { href: "/profile", label: "Профиль" },
];

type NavbarProfile = {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

function makeInitials(profile?: NavbarProfile): string {
  const user = profile?.user;
  const displayName = user?.displayName?.trim();

  if (user?.firstName || user?.lastName) {
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .trim()
      .slice(0, 2)
      .toUpperCase();
  }

  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }

    return displayName.slice(0, 2).toUpperCase();
  }

  return (user?.email?.split("@")[0] ?? "U").slice(0, 2).toUpperCase();
}

export function Navbar(): JSX.Element {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();

  const profileQuery = useQuery({
    ...trpc.profile.getMyProfile.queryOptions(),
    enabled: Boolean(isSignedIn),
    staleTime: 60_000,
  });

  const profile = profileQuery.data as NavbarProfile | undefined;
  const avatarUrl = profile?.user.avatarUrl ?? null;
  const displayName =
    profile?.user.displayName ||
    [profile?.user.firstName, profile?.user.lastName].filter(Boolean).join(" ") ||
    profile?.user.email ||
    "Профиль";

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8ECE8] bg-white/88 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <Logo href={isSignedIn ? "/home" : "/"} size="md" />

        <SignedIn>
          <nav className="hidden items-center gap-2 lg:flex">
            {studentLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-[#FFF0EB] text-[#17384B]"
                      : "text-[#526470] hover:bg-[#F6F8F7] hover:text-[#17384B]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </SignedIn>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-[18px] border-[#D8E3DE] bg-white px-4 text-[14px] font-semibold text-[#17384B] hover:bg-[#F8FAF8]"
            >
              <Link href="/login">Войти</Link>
            </Button>

            <Button
              asChild
              className="h-10 rounded-[18px] border-0 bg-[#FF9F8A] px-4 text-[14px] font-semibold text-white shadow-[0_10px_20px_rgba(255,159,138,0.18)] hover:bg-[#F28977]"
            >
              <Link href="/register">Регистрация</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-2 py-1 transition hover:border-[#FFB5A4] md:flex"
              title="Открыть профиль"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватарка пользователя"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17384B] text-xs font-black text-white">
                  {makeInitials(profile)}
                </span>
              )}
              <span className="max-w-[140px] truncate pr-2 text-sm font-bold text-[#17384B]">
                {displayName}
              </span>
            </Link>

            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
