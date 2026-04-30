"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type BusinessAccess =
  | "admin"
  | "partner"
  | "partner_pending"
  | "partner_rejected"
  | "partner_suspended"
  | "staff_mobile_only"
  | "no_access";

type BusinessMe = {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    status: string;
  };
  roles: string[];
  isAdmin: boolean;
  businessAccess: BusinessAccess;
  membership: {
    role: string;
    isActive: boolean;
    partnerId: string;
  } | null;
  partner: {
    id: string;
    brandName: string;
    legalName: string;
    status: string;
    rejectionReason: string | null;
    contactEmail: string;
  } | null;
};

type NavLink = {
  href: string;
  label: string;
  description?: string;
  isDev?: boolean;
  isVisible?: boolean;
};

const accessLabels: Record<BusinessAccess, string> = {
  admin: "Администратор",
  partner: "Партнёр",
  partner_pending: "Заявка на проверке",
  partner_rejected: "Заявка отклонена",
  partner_suspended: "Партнёр приостановлен",
  staff_mobile_only: "Только staff app",
  no_access: "Нет доступа",
};

const accessBadgeClassNames: Record<BusinessAccess, string> = {
  admin: "border-[#DDE8EA] bg-[#17384B] text-white",
  partner: "border-green-200 bg-green-50 text-green-700",
  partner_pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  partner_rejected: "border-red-200 bg-red-50 text-red-700",
  partner_suspended: "border-red-200 bg-red-50 text-red-700",
  staff_mobile_only: "border-blue-200 bg-blue-50 text-blue-700",
  no_access: "border-[#E5ECE9] bg-[#F9FAF8] text-[#526470]",
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(
  me: BusinessMe | undefined,
  fallbackName?: string | null
): string {
  const firstName = me?.user.firstName?.trim();
  const lastName = me?.user.lastName?.trim();

  if (firstName || lastName) {
    const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`
      .trim()
      .slice(0, 2)
      .toUpperCase();

    return initials || "UB";
  }

  const displayName = me?.user.displayName?.trim() || fallbackName?.trim();

  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }

    return displayName.slice(0, 2).toUpperCase();
  }

  return (me?.user.email?.split("@")[0] ?? "UB").slice(0, 2).toUpperCase();
}

export function BusinessNavbar(): JSX.Element {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const trpc = useTRPC();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const meQuery = useQuery({
    ...trpc.business.auth.getMe.queryOptions(),
    enabled: Boolean(isSignedIn),
    staleTime: 5 * 60 * 1000,
  });

  const me = meQuery.data as BusinessMe | undefined;
  const businessAccess = me?.businessAccess ?? "no_access";

  const navLinks = useMemo<NavLink[]>(() => {
    const isAdmin = me?.isAdmin === true || businessAccess === "admin";

    const hasPartnerArea = [
      "partner",
      "partner_pending",
      "partner_rejected",
      "partner_suspended",
    ].includes(businessAccess);

    return [
      {
        href: "/",
        label: "Портал",
        description: "Стартовая страница",
        isVisible: true,
      },
      {
        href: "/partner",
        label: "Партнёр",
        description: "Кабинет партнёра",
        isVisible: hasPartnerArea || !isAdmin,
      },
      {
        href: "/admin",
        label: "Админ",
        description: "Модерация и управление",
        isVisible: isAdmin,
      },
      {
        href: "/staff",
        label: "Staff QR",
        description: "Проверка QR-кодов",
        isDev: true,
        isVisible: true,
      },
    ].filter((link) => link.isVisible !== false);
  }, [businessAccess, me?.isAdmin]);

  const dropdownLinks = useMemo<NavLink[]>(() => {
    return [
      ...navLinks,
      {
        href: "/partner/apply",
        label: "Заявка партнёра",
        description: "Подать или обновить заявку",
        isVisible: businessAccess === "no_access",
      },
      {
        href: "/access-denied",
        label: "Статус доступа",
        description: "Причина ограничения доступа",
        isVisible: businessAccess !== "admin" && businessAccess !== "partner",
      },
    ].filter((link) => link.isVisible !== false);
  }, [businessAccess, navLinks]);

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

  const displayName =
    me?.user.displayName ||
    [me?.user.firstName, me?.user.lastName].filter(Boolean).join(" ") ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Профиль";

  const email =
    me?.user.email || user?.primaryEmailAddress?.emailAddress || "business user";

  const avatarUrl = user?.imageUrl ?? null;
  const partnerName = me?.partner?.brandName ?? null;

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8ECE8] bg-white/88 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17384B] text-base font-black text-white shadow-[0_10px_20px_rgba(23,56,75,0.16)] transition group-hover:bg-[#FF9F8A]">
            UB
          </div>

          <div className="leading-none">
            <p className="text-base font-black tracking-tight text-[#17384B]">
              UniBestia
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#FF7F6E]">
              Business
            </p>
          </div>
        </Link>

        <SignedIn>
          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => {
              const isActive = isActivePath(pathname, link.href);

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

                  {link.isDev && (
                    <span className="ml-2 rounded-full bg-[#17384B] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      dev
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </SignedIn>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/login"
              className="h-10 rounded-[18px] border border-[#D8E3DE] bg-white px-4 py-2 text-sm font-semibold text-[#17384B] transition hover:bg-[#F8FAF8]"
            >
              Войти
            </Link>

            <Link
              href="/sign-up"
              className="ub-gradient-button hidden h-10 rounded-[18px] px-4 py-2 text-sm font-semibold text-white md:inline-flex"
            >
              Регистрация
            </Link>
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
                    alt="Аватар пользователя"
                    width={36}
                    height={36}
                    sizes="36px"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17384B] text-xs font-black text-white">
                    {getInitials(me, user?.fullName)}
                  </span>
                )}

                <span className="hidden max-w-[160px] truncate pr-1 text-sm font-bold text-[#17384B] md:inline">
                  {displayName}
                </span>

                <span className="pr-2 text-xs font-black text-[#9CA3AF]">
                  {isProfileMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="ub-animate-slide-down absolute right-0 mt-3 w-[310px] overflow-hidden rounded-[24px] border border-[#E5ECE9] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                >
                  <div className="border-b border-[#E5ECE9] bg-[#F9FAF8] p-4">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Аватар пользователя"
                          width={48}
                          height={48}
                          sizes="48px"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#17384B] text-sm font-black text-white">
                          {getInitials(me, user?.fullName)}
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

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-[11px] font-black",
                          accessBadgeClassNames[businessAccess],
                        ].join(" ")}
                      >
                        {meQuery.isLoading
                          ? "Проверяем доступ"
                          : accessLabels[businessAccess]}
                      </span>

                      {partnerName && (
                        <span className="rounded-full border border-[#E5ECE9] bg-white px-3 py-1 text-[11px] font-black text-[#526470]">
                          {partnerName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    {dropdownLinks.map((link) => {
                      const isActive = isActivePath(pathname, link.href);

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
                          <span className="flex items-center gap-2 text-sm font-black text-[#17384B]">
                            {link.label}

                            {link.isDev && (
                              <span className="rounded-full bg-[#17384B] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                                dev
                              </span>
                            )}
                          </span>

                          {link.description && (
                            <span className="mt-1 block text-xs text-[#6B7280]">
                              {link.description}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#E5ECE9] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        void signOut({ redirectUrl: "/login" });
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
                UniBestia Business
              </p>
              <p className="mt-1 text-sm font-bold text-[#17384B]">
                Портал партнёров, сотрудников и администраторов
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-[11px] font-black",
                    accessBadgeClassNames[businessAccess],
                  ].join(" ")}
                >
                  {meQuery.isLoading
                    ? "Проверяем доступ"
                    : accessLabels[businessAccess]}
                </span>

                {partnerName && (
                  <span className="rounded-full border border-[#E5ECE9] bg-white px-3 py-1 text-[11px] font-black text-[#526470]">
                    {partnerName}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              {dropdownLinks.map((link) => {
                const isActive = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "rounded-2xl px-4 py-3 transition",
                      isActive ? "bg-[#FFF0EB]" : "hover:bg-[#F7F6F1]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 text-sm font-black text-[#17384B]">
                      {link.label}

                      {link.isDev && (
                        <span className="rounded-full bg-[#17384B] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                          dev
                        </span>
                      )}
                    </span>

                    {link.description && (
                      <span className="mt-1 block text-xs text-[#6B7280]">
                        {link.description}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  void signOut({ redirectUrl: "/login" });
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