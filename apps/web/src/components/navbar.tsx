"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/base/button";
import { type JSX, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { useTRPC } from "@/utils/trpc";

const studentLinks = [
  { href: "/home", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
];

const dropdownLinks = [
  { href: "/profile", label: "Профиль", description: "Данные студента" },
  { href: "/favorites", label: "Избранное", description: "Избранные скидки"},
  { href: "/notifications", label: "Уведомления", description: "События и статусы"},
  { href: "/wallet", label: "Кошелёк", description: "Бонусы и баланс" },
  { href: "/my-redemptions", label: "Мои скидки", description: "QR и история" },
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
    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .trim()
      .slice(0, 2)
      .toUpperCase();

    return initials || "U";
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
  const { signOut } = useClerk();
  const trpc = useTRPC();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileQuery = useQuery({
    ...trpc.profile.getMyProfile.queryOptions(),
    enabled: Boolean(isSignedIn),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    function handleAvatarUpdated(): void {
      void profileQuery.refetch();
    }

    window.addEventListener("unibestia-avatar-updated", handleAvatarUpdated);

    return () => {
      window.removeEventListener(
        "unibestia-avatar-updated",
        handleAvatarUpdated
      );
    };
  }, [isSignedIn, profileQuery]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent): void {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const profile = profileQuery.data as NavbarProfile | undefined;
  const avatarUrl = profile?.user.avatarUrl ?? null;

  const displayName =
    profile?.user.displayName ||
    [profile?.user.firstName, profile?.user.lastName]
      .filter(Boolean)
      .join(" ") ||
    profile?.user.email ||
    "Профиль";

  const email = profile?.user.email ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8ECE8] bg-white/88 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-md">
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
              className="ub-gradient-button hidden h-10 rounded-[18px] border-0 px-4 text-[14px] font-semibold text-white md:inline-flex"
            >
              <Link href="/register">Регистрация</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[18px] border border-[#E5ECE9] bg-[#F9FAF8] text-lg font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-white lg:hidden"
              aria-label="Открыть меню"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? "×" : "☰"}
            </button>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-2 py-1 transition hover:border-[#FFB5A4] hover:bg-white"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Аватарка пользователя"
                    width={36}
                    height={36}
                    sizes="36px"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17384B] text-xs font-black text-white">
                    {makeInitials(profile)}
                  </span>
                )}

                <span className="hidden max-w-[150px] truncate pr-1 text-sm font-bold text-[#17384B] md:inline">
                  {displayName}
                </span>

                <span className="pr-2 text-xs font-black text-[#9CA3AF]">
                  {isProfileMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="ub-animate-slide-down absolute right-0 mt-3 w-[280px] overflow-hidden rounded-[24px] border border-[#E5ECE9] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                >
                  <div className="border-b border-[#E5ECE9] bg-[#F9FAF8] p-4">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Аватарка пользователя"
                          width={48}
                          height={48}
                          sizes="48px"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#17384B] text-sm font-black text-white">
                          {makeInitials(profile)}
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#17384B]">
                          {displayName}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#6B7280]">
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {dropdownLinks.map((link) => {
                      const isActive =
                        pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          className={[
                            "block rounded-2xl px-4 py-3 transition",
                            isActive ? "bg-[#FFF0EB]" : "hover:bg-[#F7F6F1]",
                          ].join(" ")}
                        >
                          <span className="block text-sm font-black text-[#17384B]">
                            {link.label}
                          </span>
                          <span className="mt-1 block text-xs text-[#6B7280]">
                            {link.description}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#E5ECE9] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        void signOut({ redirectUrl: "/" });
                      }}
                      className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 transition hover:bg-red-50"
                    >
                      Выйти из аккаунта
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SignedIn>
        </div>
      </div>

      <SignedIn>
        {isMobileMenuOpen && (
          <div className="ub-animate-slide-down absolute left-4 right-4 top-[76px] z-50 rounded-[28px] border border-[#E5ECE9] bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)] lg:hidden">
            <div className="mb-2 rounded-[22px] bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
                UniBestia
              </p>
              <p className="mt-1 text-sm font-bold text-[#17384B]">
                Студенческая витрина скидок
              </p>
            </div>

            <div className="grid gap-2">
              {studentLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "rounded-2xl px-4 py-3 text-sm font-black transition",
                      isActive
                        ? "bg-[#FFF0EB] text-[#17384B]"
                        : "text-[#526470] hover:bg-[#F7F6F1] hover:text-[#17384B]",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="my-2 h-px bg-[#E5ECE9]" />

              {dropdownLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "rounded-2xl px-4 py-3 transition",
                      isActive ? "bg-[#FFF0EB]" : "hover:bg-[#F7F6F1]",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-black text-[#17384B]">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-xs text-[#6B7280]">
                      {link.description}
                    </span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  void signOut({ redirectUrl: "/" });
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 transition hover:bg-red-50"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        )}
      </SignedIn>
    </header>
  );
}