import { type JSX } from "react";

const requests = [
  {
    title: "Публикация скидки 10% на обеды",
    type: "offer_publication",
    status: "pending",
  },
  {
    title: "Изменение условий Coffee 15%",
    type: "offer_update",
    status: "review",
  },
];

export default function PartnerRequestsPage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Requests
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Заявки партнёра
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Заявки на публикацию скидок, изменение условий, добавление точек и
          модерацию контента.
        </p>
      </section>

      <section className="mt-6 grid gap-4">
        {requests.map((request) => (
          <div
            key={request.title}
            className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-[#17384B]">
                  {request.title}
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">{request.type}</p>
              </div>
              <span className="w-fit rounded-2xl bg-[#FFF0EB] px-4 py-2 text-sm font-black text-[#FF7F6E]">
                {request.status}
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
