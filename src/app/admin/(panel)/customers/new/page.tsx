import Link from "next/link";
import NewCustomerForm from "./NewCustomerForm";

/* A customer begins with a name. Everything else can arrive later,
   with their first order. */

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <main>
      <Link href="/admin/customers" className="link-hair text-dusk text-[13px]">
        All customers
      </Link>
      <h1 className="font-serif text-display-section mt-6">A new customer.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Name is enough to start. Phone makes their chat one tap.
      </p>
      <NewCustomerForm />
    </main>
  );
}
