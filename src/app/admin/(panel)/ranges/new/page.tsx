import RangeForm from "../RangeForm";
import Back from "../../Back";

export const dynamic = "force-dynamic";

export default function NewRangePage() {
  return (
    <main>
      <Back href="/admin/ranges" label="The ranges" />
      <h1 className="font-serif text-display-section mt-6">A new range.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        A shelf. The address is minted once; the name can change.
      </p>
      <RangeForm />
    </main>
  );
}
