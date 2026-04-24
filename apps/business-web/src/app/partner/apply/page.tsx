"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type JSX, useState } from "react";
import { useTRPCClient } from "@/utils/trpc";

export default function PartnerApplyPage(): JSX.Element {
  const router = useRouter();
  const trpcClient = useTRPCClient();

  const [legalName, setLegalName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const created = await trpcClient.business.partner.submitApplication.mutate({
        legalName,
        brandName,
        description: description.trim() || undefined,
        contactEmail,
        contactPhone: contactPhone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
      });

      setMessage(
        `Заявка отправлена: ${created.partner.brandName} (${created.partner.status})`
      );

      setTimeout(() => {
        router.push("/partner/pending");
      }, 700);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отправить заявку"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[980px] px-4 py-10 md:px-6 lg:px-8">
      <Link href="/" className="mb-5 inline-flex text-sm font-bold text-[#FF7F6E]">
        ← Назад на портал
      </Link>

      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner Application
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Заявка на подключение партнёра
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          После отправки компания получит статус pending. Админ должен одобрить
          партнёра в разделе /admin/partners.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
      >
        <div className="grid gap-5">
          <label>
            <span className="text-sm font-bold text-[#17384B]">
              Юридическое название
            </span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              required
              minLength={2}
              maxLength={255}
              placeholder="ТОО Coffee Lab Kazakhstan"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-[#17384B]">
              Название бренда
            </span>
            <input
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              required
              minLength={2}
              maxLength={255}
              placeholder="Coffee Lab"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-[#17384B]">
              Описание бизнеса
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Кофейня рядом с университетами, скидки для студентов..."
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm outline-none focus:border-[#FF9F8A]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-[#17384B]">
                Контактный email
              </span>
              <input
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                required
                type="email"
                placeholder="partner@example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">
                Телефон
              </span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="+7 777 000 00 00"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="text-sm font-bold text-[#17384B]">Сайт</span>
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                type="url"
                placeholder="https://example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">Instagram</span>
              <input
                value={instagramUrl}
                onChange={(event) => setInstagramUrl(event.target.value)}
                type="url"
                placeholder="https://instagram.com/brand"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">Logo URL</span>
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                type="url"
                placeholder="https://example.com/logo.png"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>
          </div>

          {message && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href="/"
              className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-center text-sm font-bold text-[#17384B]"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSaving ? "Отправляем..." : "Отправить заявку"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
