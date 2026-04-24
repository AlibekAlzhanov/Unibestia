import { type JSX } from "react";

const locations = [
  {
    name: "Coffee Lab Satbayev",
    city: "Almaty",
    address: "улица Сатпаева, рядом с кампусом",
    status: "active",
  },
  {
    name: "Coffee Lab Mega",
    city: "Almaty",
    address: "улица Розыбакиева, Mega Center",
    status: "active",
  },
];

export default function PartnerLocationsPage(): JSX.Element {
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
          Управление адресами партнёра и привязка офферов к конкретным точкам.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {locations.map((location) => (
          <div
            key={location.name}
            className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm font-semibold text-[#9CA3AF]">
              {location.city}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#17384B]">
              {location.name}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">{location.address}</p>
            <span className="mt-4 inline-flex rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
              {location.status}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
