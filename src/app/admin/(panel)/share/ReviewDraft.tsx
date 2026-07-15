"use client";

import { useState, useTransition } from "react";
import { createOrderFromDraft } from "./draft-actions";
import type { CreatePayload } from "./draft-types";
import type { OrderDraft } from "@/lib/ai/types";
import { naira, parseNaira, buzz } from "@/lib/backoffice";
import AdminSheet from "@/components/AdminSheet";
import { useRaiseDraft } from "./MatchPanel";

/* The draft, dressed to the house and adaptive: a detent sheet on the
   phone, and inline beside the intake on a wide screen. One state feeds
   both slots, so an edit reads the same either way. Nothing is saved
   until the owner taps; the price starts from the ledger and is his to
   change; the model never set it. */

type Line = {
  pieceSlug: string | null;
  label: string;
  quantity: number;
  unit: string;
  unknown: boolean;
  sourceQuote?: string;
  price: string;
  seeded: boolean;
};

const field =
  "rounded-[16px] bg-shell/60 px-4 py-3 text-[16px] text-ink tabular-nums outline-none focus:bg-shell transition-colors duration-300";

type BodyProps = {
  lines: Line[];
  matchedCustomer: { id: string; name: string } | null;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  patch: (i: number, p: Partial<Line>) => void;
  drop: (i: number) => void;
  total: number;
  missingCount: number;
  needsName: boolean;
  pending: boolean;
  error: string;
  create: () => void;
  onStartOver: () => void;
};

function ReviewBody(props: BodyProps) {
  const {
    lines,
    matchedCustomer,
    name,
    setName,
    phone,
    setPhone,
    patch,
    drop,
    total,
    missingCount,
    needsName,
    pending,
    error,
    create,
    onStartOver,
  } = props;

  return (
    <div className="grid gap-5">
      <div>
        <p className="eyebrow">The draft</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">Check it, fix a price, then create.</p>
      </div>

      {matchedCustomer ? (
        <div className="panel">
          <p className="eyebrow">Customer</p>
          <p className="mt-2 font-serif text-[20px]">{matchedCustomer.name}</p>
        </div>
      ) : (
        <div className="panel grid gap-4">
          <p className="eyebrow">Who is this</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Customer name"
            className={`${field} w-full`}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            inputMode="tel"
            aria-label="Customer phone"
            className={`${field} w-full`}
          />
        </div>
      )}

      {lines.map((l, i) => (
        <div key={i} className="panel grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-serif text-[20px]">{l.label}</p>
            {l.unknown && (
              <span className="chip-glass text-[11px] uppercase tracking-[0.14em] text-gold">
                Check this one
              </span>
            )}
          </div>
          {l.sourceQuote && (
            <p className="text-[14px] italic leading-relaxed text-dusk">&ldquo;{l.sourceQuote}&rdquo;</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={l.quantity}
              onChange={(e) => {
                const q = parseInt(e.target.value, 10);
                patch(i, { quantity: Number.isFinite(q) && q > 0 ? q : 0 });
              }}
              inputMode="numeric"
              aria-label="Quantity"
              className={`${field} w-[68px] text-center`}
            />
            <span className="text-[14px] text-dusk">{l.unit ? `${l.unit} at` : "at"}</span>
            <span className="flex items-center gap-1 rounded-[16px] bg-shell/60 px-4 py-3">
              <span className="text-[14px] text-mist">&#8358;</span>
              <input
                value={l.price}
                onChange={(e) => patch(i, { price: e.target.value, seeded: false })}
                inputMode="numeric"
                placeholder="your price"
                aria-label="Price"
                className="w-[92px] bg-transparent text-[16px] tabular-nums text-ink outline-none placeholder:text-mist"
              />
            </span>
            <button type="button" onClick={() => drop(i)} className="link-hair ml-auto text-[12px] text-mist">
              Drop
            </button>
          </div>
          {l.seeded ? (
            <p className="text-[12px] text-mist">The last price you gave for this piece.</p>
          ) : (
            !l.price.trim() && (
              <p className="text-[12px] text-gold">No past sale to borrow a price from. Your number, please.</p>
            )
          )}
        </div>
      ))}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Quote so far</p>
          <p className="mt-1 font-serif text-[30px] tabular-nums">{naira(total)}</p>
        </div>
        {missingCount > 0 && (
          <p className="max-w-[140px] text-right text-[12px] text-mist">
            {missingCount === 1
              ? "One item still needs your price."
              : `${missingCount} items still need your price.`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={create}
          disabled={pending || lines.length === 0 || needsName}
          className="btn-gold disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create the quote"}
        </button>
        <button type="button" onClick={onStartOver} className="link-hair text-[12px] text-dusk">
          Read a different chat
        </button>
        {error && (
          <p role="status" className="text-[14px] text-gold">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReviewDraft({
  draft,
  matchedCustomer = null,
  suggestedName = "",
  suggestedPhone = "",
  onClose,
}: {
  draft: OrderDraft;
  matchedCustomer?: { id: string; name: string } | null;
  suggestedName?: string;
  suggestedPhone?: string;
  onClose?: () => void;
}) {
  const [lines, setLines] = useState<Line[]>(
    draft.lines.map((l) => ({
      pieceSlug: l.pieceSlug,
      label: l.pieceName || l.description || "Item",
      quantity: l.quantity,
      unit: l.unit,
      unknown: l.unknown,
      sourceQuote: l.sourceQuote,
      price: l.listPriceKobo != null ? String(Math.round(l.listPriceKobo / 100)) : "",
      seeded: l.listPriceKobo != null,
    }))
  );
  const [name, setName] = useState(matchedCustomer?.name ?? draft.customerName ?? suggestedName ?? "");
  const [phone, setPhone] = useState(suggestedPhone ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(true);

  /* While the draft stands, the page's own match panel steps aside. */
  useRaiseDraft();

  const patch = (i: number, p: Partial<Line>) =>
    setLines((prev) => prev.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const drop = (i: number) => setLines((prev) => prev.filter((_, k) => k !== i));

  const total = lines.reduce((sum, l) => sum + parseNaira(l.price) * (l.quantity || 0), 0);
  const needsName = !matchedCustomer && !name.trim();
  const missingCount = lines.filter((l) => !l.price.trim()).length;

  const create = () => {
    if (lines.length === 0 || needsName) return;
    buzz(4);
    setError("");
    const payload: CreatePayload = {
      customerId: matchedCustomer?.id,
      newCustomer: matchedCustomer ? undefined : { name: name.trim(), phone: phone.trim(), area: "" },
      lines: lines.map((l) => ({
        pieceSlug: l.pieceSlug,
        description: l.label,
        quantity: l.quantity,
        givenPrice: l.price,
      })),
    };
    start(async () => {
      const res = await createOrderFromDraft(payload);
      if (res && !res.ok) setError(res.message);
    });
  };

  const startOver = () => (onClose ? onClose() : window.location.reload());

  const bodyProps: BodyProps = {
    lines,
    matchedCustomer,
    name,
    setName,
    phone,
    setPhone,
    patch,
    drop,
    total,
    missingCount,
    needsName,
    pending,
    error,
    create,
    onStartOver: startOver,
  };

  return (
    <>
      <div className="mt-6 hidden xl:mt-0 xl:block">
        <ReviewBody {...bodyProps} />
      </div>
      <AdminSheet
        compactOnly
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) startOver();
        }}
        title="Check the draft"
      >
        <ReviewBody {...bodyProps} />
      </AdminSheet>
    </>
  );
}
