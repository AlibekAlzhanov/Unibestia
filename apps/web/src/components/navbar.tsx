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
import { Logo } from "@/components/logo";

const studentLinks = [
  { href: "/home", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/wallet", label: "Кошелёк" },
  { href: "/my-redemptions", label: "Мои скидки" },
  { href: "/profile", label: "Профиль" },
];

export function Navbar(): JSX.Element {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

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
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}