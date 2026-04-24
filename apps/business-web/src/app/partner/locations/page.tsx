"use client";

import { type FormEvent, type JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function PartnerLocationsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const locationsQuery = useQuery(
    trpc.business.partner.listLocations.queryOptions()
  );

  const [name, setName] = useState("");
  const [city, setCity] = useState("Almaty");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locations = locationsQuery.data?.items ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const created = await trpcClient.business.partner.createLocation.mutate({
        name,
        city: city.trim() || undefined,
        address,
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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Locations
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Точки продаж
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Партнёр управляет адресами, где действуют скидки. Эти точки можно
          привязать к офферу при создании скидки.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
        >
          <h2 className="text-xl font-bold text-[#17384B]">Добавить точку</h2>

          <div className="mt-5 grid gap-4">
            <label>
              <span className="text-sm font-bold text-[#17384B]">
                Название точки
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                placeholder="Coffee Lab Satbayev"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">Город</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Almaty"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">Адрес</span>
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                minLength={5}
                rows={3}
                placeholder="улица Сатпаева, рядом с кампусом"
                className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-[#17384B]">
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
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
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

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSaving ? "Сохраняем..." : "Добавить точку"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">
            Список точек
          </h2>

          <div className="mt-5 grid gap-4">
            {locationsQuery.isLoading ? (
              <p className="text-sm text-[#6B7280]">Загружаем точки...</p>
            ) : locations.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                У партнёра пока нет точек продаж.
              </p>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#17384B]">
                        {location.name}
                      </p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {[location.city, location.address].filter(Boolean).join(", ")}
                      </p>
                      {(location.latitude || location.longitude) && (
                        <p className="mt-1 text-xs text-[#94A3B8]">
                          {location.latitude ?? "—"}, {location.longitude ?? "—"}
                        </p>
                      )}
                    </div>

                    <span className="rounded-2xl bg-white px-3 py-1 text-xs font-bold text-[#526470]">
                      {location.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
