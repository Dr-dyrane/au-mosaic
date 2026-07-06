"use client";

import Link from "next/link";
import { naira } from "@/lib/backoffice";
import { fmtDate, type OrderStatus } from "./pipeline";
import { RowCheckbox, useSelect } from "../records/select";

/* One order card. At rest it links into the order. In select mode it
   stops linking and becomes a chooser: a tap marks it for the bar. */

export type OrderRow = {
  id: string;
  customerName: string;
  status: OrderStatus;
  billed: number;
  balance: number;
  gap: number;
  createdAt: string;
};

function Inner({ row }: { row: OrderRow }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-[20px] leading-snug transition-colors duration-300 group-hover:text-gold">
          {row.customerName}
        </p>
        <p className="shrink-0 text-[12px] uppercase tracking-[0.14em] text-mist">{fmtDate(row.createdAt)}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[14px] text-dusk">Billed {naira(row.billed)}</p>
        <p className="text-[14px] font-medium text-ink">Balance {naira(row.balance)}</p>
      </div>
      {row.status === "enquiry" && row.billed === 0 && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">No lines yet</p>
      )}
      {row.gap > 0 && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Discount given / {naira(row.gap)} below list
        </p>
      )}
    </>
  );
}

export default function OrderCard({ row }: { row: OrderRow }) {
  const { mode, selected, toggle } = useSelect();

  if (mode) {
    const on = selected.has(row.id);
    return (
      <button
        type="button"
        onClick={() => toggle(row.id)}
        aria-pressed={on}
        className="panel group block w-full text-left transition-transform duration-300 active:scale-[0.99]"
      >
        <div className="flex items-start gap-3">
          <RowCheckbox id={row.id} />
          <div className="min-w-0 flex-1">
            <Inner row={row} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <Link
      href={`/admin/orders/${row.id}`}
      data-tour="order-card"
      className="panel group block transition-transform duration-300 active:scale-[0.99]"
    >
      <Inner row={row} />
    </Link>
  );
}
