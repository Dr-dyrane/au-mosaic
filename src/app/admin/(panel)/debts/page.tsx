import { naira, waChat } from "@/lib/backoffice";
import Teach from "../Teach";
import DebtorsFeed from "./DebtorsFeed";
import { fetchDebtors, fetchGrandOwed } from "./load-debtors";

/* Who owes what. The room Nonso asked for first: every order billed
   more than it is paid, grouped by customer, the longest forgotten
   debt at the top. Read only; the only way out is a gentle WhatsApp
   nudge from the customer panel. The list scrolls a page at a time, so
   a full book never lands all at once. */

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const [firstPage, grand] = await Promise.all([fetchDebtors(0), fetchGrandOwed()]);
  const debtors = firstPage.items;
  const hasDebtors = debtors.length > 0;

  /* The oldest debtor leads the list, so their reminder is the room's
     one gold action. */
  const oldest = debtors[0];
  const oldestReminder = oldest?.phone
    ? waChat(
        oldest.phone,
        `Good day ${oldest.name}. A gentle reminder from AU Mosaic on a balance of ${naira(oldest.total)}. Thank you.`
      )
    : null;

  return (
    <main>
      {oldestReminder && (
        <span
          hidden
          data-admin-action
          data-href={oldestReminder}
          data-label="Remind oldest"
          data-room="owed"
          data-external="true"
        />
      )}
      {!oldestReminder && hasDebtors && (
        <span
          hidden
          data-admin-action
          data-href="/admin/orders"
          data-label="Open orders"
          data-room="orders"
        />
      )}
      {hasDebtors && (
        <span
          hidden
          data-admin-context-action
          data-href="/admin/export/debts.csv"
          data-label="Export debts"
        />
      )}
      <p className="eyebrow">Owed</p>
      <h1 className="font-serif text-display-section mt-3" data-tour="debts">Owed.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Unpaid balances, oldest first.
        <Teach> Tap a name to nudge on WhatsApp.</Teach>
      </p>

      {hasDebtors && (
        <div className="mt-8">
          <p className="font-serif text-display-section leading-none">{naira(grand)}</p>
          <p className="mt-2 text-[14px] text-dusk">owed across everyone</p>
        </div>
      )}

      {hasDebtors ? (
        <DebtorsFeed initial={debtors} initialDone={firstPage.done} loadMore={fetchDebtors} />
      ) : (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nobody owes the house. Enjoy it.</p>
        </div>
      )}
    </main>
  );
}
