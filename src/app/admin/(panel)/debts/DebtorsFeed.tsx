"use client";

import Link from "next/link";
import InfiniteList, { type Batch } from "@/components/InfiniteList";
import { naira, waChat } from "@/lib/backoffice";
import type { Debtor } from "./debtors-types";

/* The room's long list, scrolled not paged: the first debtors paint on
   the server, the rest arrive as the reader nears the end. The oldest
   debt sits at the very top; every row carries the same reminder. */

const STATUS_LABEL: Record<string, string> = {
  quoted: "Quoted",
  deposit: "Deposit paid",
  delivered: "Delivered",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DebtorsFeed({
  initial,
  initialDone,
  loadMore,
}: {
  initial: Debtor[];
  initialDone: boolean;
  loadMore: (offset: number) => Promise<Batch<Debtor>>;
}) {
  return (
    <InfiniteList
      initial={initial}
      initialDone={initialDone}
      loadMore={loadMore}
      className="mt-10 grid items-start gap-4 lg:grid-cols-2"
      skeletonCount={2}
      renderItem={(d) => (
        <section key={d.id} className="panel">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-serif text-[20px]">{d.name}</p>
            <p className="font-serif text-[20px]">{naira(d.total)}</p>
          </div>
          {d.phone && (
            <a
              href={waChat(
                d.phone,
                `Good day ${d.name}. A gentle reminder from AU Mosaic on a balance of ${naira(d.total)}. Thank you.`
              )}
              target="_blank"
              rel="noopener"
              className="link-hair mt-2 text-[12px] text-dusk"
            >
              Remind on WhatsApp
            </a>
          )}
          <div className="mt-5 grid gap-3">
            {d.orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3">
                <p className="text-[14px] text-dusk">{fmtDate(o.createdAt)}</p>
                <span className="chip-solid shrink-0">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                <p className="ml-auto text-[14px]">{naira(o.balance)}</p>
                <Link href={`/admin/orders/${o.id}`} className="link-hair text-[12px]">
                  See the order
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      renderSkeleton={(index) => (
        <div key={index} className="panel" aria-hidden>
          <div className="flex items-baseline justify-between gap-3">
            <div className="skel h-6 w-40 rounded-full" />
            <div className="skel h-6 w-24 rounded-full" />
          </div>
          <div className="skel mt-4 h-4 w-28 rounded-full" />
          <div className="skel mt-5 h-4 w-full rounded-full" />
          <div className="skel mt-3 h-4 w-3/4 rounded-full" />
        </div>
      )}
    />
  );
}
