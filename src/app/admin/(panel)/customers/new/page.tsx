import NewCustomerForm from "./NewCustomerForm";
import Back from "../../Back";

/* A customer begins with a name. Everything else can arrive later,
   with their first order. */

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <main>
      <Back href="/admin/customers" label="All customers" />
      <h1 className="font-serif text-display-section mt-6">A new customer.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Name is enough to start. Phone makes their chat one tap.
      </p>
      <NewCustomerForm />
    </main>
  );
}
