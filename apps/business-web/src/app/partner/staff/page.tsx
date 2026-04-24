import { type JSX } from "react";

const staff = [
  { name: "Staff User", role: "cashier", location: "Coffee Lab Satbayev" },
  { name: "Manager User", role: "manager", location: "All locations" },
];

export default function PartnerStaffPage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Staff
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Сотрудники партнёра
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Управление доступом сотрудников к staff mobile app, ролям и точкам
          продаж.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {staff.map((member) => (
          <div
            key={member.name}
            className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <h2 className="text-xl font-bold text-[#17384B]">{member.name}</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Роль: {member.role} · Точка: {member.location}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
