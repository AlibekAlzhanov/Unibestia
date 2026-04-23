
import Link from "next/link";
import { type JSX } from "react";
import { Button } from "@repo/ui/components/base/button";
import { Logo } from "@/components/logo";

export function Navbar(): JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E8ECE8] bg-white/88 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <Logo size="md" />
        <div className="flex items-center gap-2.5">
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
        </div>
      </div>
    </header>
  );
}
