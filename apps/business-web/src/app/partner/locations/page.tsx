"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type PartnerLocation = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
};

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function coordinateText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function statusClass(isActive?: boolean | null): string {
  return isActive === false
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";
}

function statusLabel(isActive?: boolean | null): string {
  return isActive === false ? "inactive" : "active";
}

function LoadingLocations(): JSX.Element {
  return (
    <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="ub-skeleton h-7 w-28 rounded-full" />
          <div className="ub-skeleton mt-5 h-6 w-3/4 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="ub-skeleton h-20 rounded-2xl" />
            <div className="ub-skeleton h-20 rounded-2xl" />
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyLocations({
  hasSearch,
  onReset,
}: {
  hasSearch: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        📍
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Точки продаж не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasSearch
          ? "По текущему поиску нет точек. Очисти поиск или добавь новую точку продаж."
          : "Добавь первую точку продаж, чтобы привязывать к ней скидки и QR-активации."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Очистить поиск
        </button>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: number;
  hint: string;
  index: number;
}): JSX.Element {
  return (
    <article
      className={[
        "ub-animate-fade-up rounded-[30px] border border-white/15 bg-[linear-gradient(135deg,#17384B_0%,#255B73_70%,#FF9F8A_150%)] p-5 text-white shadow-[0_18px_42px_rgba(23,56,75,0.16)]",
        index === 1 ? "ub-delay-100" : "",
        index === 2 ? "ub-delay-200" : "",
      ].join(" ")}
    >
      <p className="text-sm font-bold text-[#DDE8EA]">{label}</p>

      <p className="mt-3 text-4xl font-black tracking-[-0.04em]">{value}</p>

      <p className="mt-3 text-sm font-semibold text-[#FFB5A4]">{hint}</p>
    </article>
  );
}

function LocationCard({ location }: { location: PartnerLocation }): JSX.Element {
  const addressText = [location.city, location.address].filter(Boolean).join(", ");

  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            statusClass(location.isActive),
          ].join(" ")}
        >
          {statusLabel(location.isActive)}
        </span>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          ID: {location.id.slice(0, 8)}
        </span>
      </div>

      <h2 className="mt-5 text-2xl font-black leading-tight text-[#17384B]">
        {location.name}
      </h2>

      <p className="mt-3 min-h-[52px] text-sm leading-7 text-[#6B7280]">
        {addressText || "Адрес не указан"}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Latitude
          </p>

          <p className="mt-1 break-all font-bold text-[#17384B]">
            {coordinateText(location.latitude)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Longitude
          </p>

          <p className="mt-1 break-all font-bold text-[#17384B]">
            {coordinateText(location.longitude)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#F9FAF8] p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
          Created
        </p>

        <p className="mt-1 font-bold text-[#17384B]">
          {formatDateTime(location.createdAt)}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-2xl border border-[#E5ECE9] bg-white px-4 py-3 text-sm leading-6 text-[#526470]">
          Эта точка может использоваться при создании скидки и выборе места
          применения QR-кода.
        </div>
      </div>
    </article>
  );
}

export default function PartnerLocationsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [name, setName] = useState("");
  const [city, setCity] = useState("Almaty");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useQuery({
    ...trpc.business.partner.listLocations.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const locations = useMemo(
    () => (locationsQuery.data?.items ?? []) as PartnerLocation[],
    [locationsQuery.data?.items]
  );

  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return locations;
    }

    return locations.filter((location) => {
      const searchable = [
        location.name,
        location.city,
        location.address,
        location.latitude,
        location.longitude,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [locations, search]);

  const totalLocations = locations.length;
  const activeLocations = locations.filter(
    (location) => location.isActive !== false
  ).length;
  const inactiveLocations = locations.filter(
    (location) => location.isActive === false
  ).length;
  const withCoordinates = locations.filter(
    (location) => location.latitude || location.longitude
  ).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const created = await trpcClient.business.partner.createLocation.mutate({
        name: name.trim(),
        city: city.trim() || undefined,
        address: address.trim(),
        latitude: parseOptionalNumber(latitude),
        longitude: parseOptionalNumber(longitude),
      });

      setMessage(`Точка создана: ${created.name}`);
      setName("");
      setCity("Almaty");
      setAddress("");
      setLatitude("");
      setLongitude("");

      await locationsQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось создать точку"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function resetSearch(): void {
    setSearch("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Locations
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Точки продаж
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Управляйте адресами, где действуют скидки. Эти точки используются
              при создании оффера и выборе места применения QR-кода.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/offers/new"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Создать скидку
              </Link>

              <Link
                href="/partner/offers"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Список скидок
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalLocations}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeLocations}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Active
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{withCoordinates}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Geo
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего точек"
          value={totalLocations}
          hint="адреса партнёра"
          index={0}
        />

        <MetricCard
          label="Активные"
          value={activeLocations}
          hint="доступны для QR"
          index={1}
        />

        <MetricCard
          label="Неактивные"
          value={inactiveLocations}
          hint="скрытые точки"
          index={2}
        />

        <MetricCard
          label="С координатами"
          value={withCoordinates}
          hint="можно показать на карте"
          index={3}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="ub-animate-fade-up ub-card self-start rounded-[34px] p-6 md:p-7"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Новая точка
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Добавить адрес
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Укажи название филиала, город, адрес и координаты. Координаты
              необязательны, но полезны для будущей карты.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label>
              <span className="text-sm font-black text-[#17384B]">
                Название точки *
              </span>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                placeholder="Coffee Lab Satbayev"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <label>
              <span className="text-sm font-black text-[#17384B]">Город</span>

              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Almaty"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <label>
              <span className="text-sm font-black text-[#17384B]">Адрес *</span>

              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                minLength={5}
                rows={3}
                placeholder="улица Сатпаева, рядом с кампусом"
                className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Latitude
                </span>

                <input
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  type="number"
                  min="-90"
                  max="90"
                  step="0.000001"
                  placeholder="43.238949"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Longitude
                </span>

                <input
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  type="number"
                  min="-180"
                  max="180"
                  step="0.000001"
                  placeholder="76.889709"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>
            </div>

            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Сохраняем..." : "Добавить точку"}
            </button>
          </div>
        </form>

        <section className="space-y-5">
          <div className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Список точек
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Показано: {filteredLocations.length} из {locations.length}
                </h2>
              </div>

              <label className="w-full md:w-[320px]">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Поиск
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Название, город, адрес..."
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>
            </div>
          </div>

          {locationsQuery.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              Не удалось загрузить точки: {locationsQuery.error.message}
            </div>
          )}

          {locationsQuery.isLoading && !locationsQuery.data ? (
            <LoadingLocations />
          ) : filteredLocations.length === 0 ? (
            <EmptyLocations
              hasSearch={search.trim().length > 0}
              onReset={resetSearch}
            />
          ) : (
            <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
              {filteredLocations.map((location, index) => (
                <div
                  key={location.id}
                  className={[
                    "ub-animate-fade-up",
                    index === 1 ? "ub-delay-100" : "",
                    index === 2 ? "ub-delay-200" : "",
                  ].join(" ")}
                >
                  <LocationCard location={location} />
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}