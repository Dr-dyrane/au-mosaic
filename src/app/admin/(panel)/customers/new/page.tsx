import NewCustomerForm from "./NewCustomerForm";
import Back from "../../Back";

/* A customer begins with a name. Everything else can arrive later,
   with their first order. */

export const dynamic = "force-dynamic";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  /* The share bridge may arrive carrying the number it read. */
  const { phone } = await searchParams;
  const prefill = phone && /^\d{7,15}$/.test(phone) ? phone : undefined;

  return (
    <main>
      <Back href="/admin/customers" label="All customers" />
      <h1 className="font-serif text-display-section mt-6">A new customer.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Name is enough to start. Phone makes their chat one tap.
      </p>
      <NewCustomerForm phone={prefill} />
    </main>
  );
}
