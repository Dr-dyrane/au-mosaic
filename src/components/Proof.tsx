import Reveal from "@/components/Reveal";

/* The house's proof: four true stones, no badges, no borrowed
   numbers. Every line here survives the follow-up question across
   the counter, which is the only kind of reassurance worth wearing.
   The founding year, the project count, and the named work join the
   moment their facts arrive; nothing is minted to fill a slot. */

const STONES = [
  {
    eyebrow: "Ten years",
    line: "One market, one craft.",
    note: "In the market and counting.",
  },
  {
    eyebrow: "Our own line",
    line: "Foshan, China.",
    note: "Containers direct. Factory prices.",
  },
  {
    eyebrow: "On the ground",
    line: "The largest stock in Lagos.",
    note: "Walk in and touch it.",
  },
  {
    eyebrow: "Beneath it all",
    line: "Spanish Kerakoll.",
    note: "Under every surface we install.",
  },
];

export default function Proof() {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {STONES.map((s, i) => (
        <Reveal key={s.eyebrow} delay={i * 90}>
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <p className="font-serif mt-3 text-[24px] leading-snug">{s.line}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-dusk">{s.note}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
