import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { waGeneral, waQuote } from "@/lib/wa";
import { CtaRow, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Visit the showroom at Agric Market, Lagos, or chat with AU Mosaic on WhatsApp.",
};

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Come see the stock. Or just message.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-dusk">
          Most of our business happens on WhatsApp: photos, prices, delivery.
          Start there.
        </p>
        <div className="mt-8">
          <CtaRow href={waGeneral()} label="Chat on WhatsApp" />
        </div>
      </section>

      <Section title="The showroom">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-shell p-6 shadow-lift">
            <p className="text-sm font-semibold uppercase tracking-widest text-pool">Where</p>
            <p className="mt-2 font-semibold tracking-tight">{SITE.location}</p>
            <p className="mt-1 text-sm text-dusk">Ask any trader for AU Mosaic.</p>
          </div>
          <div className="rounded-3xl bg-shell p-6 shadow-lift">
            <p className="text-sm font-semibold uppercase tracking-widest text-pool">When</p>
            <p className="mt-2 font-semibold tracking-tight">{SITE.hours}</p>
            <p className="mt-1 text-sm text-dusk">Sundays, we rest.</p>
          </div>
          <div className="rounded-3xl bg-shell p-6 shadow-lift">
            <p className="text-sm font-semibold uppercase tracking-widest text-pool">Delivery</p>
            <p className="mt-2 font-semibold tracking-tight">Pickup or delivery</p>
            <p className="mt-1 text-sm text-dusk">Collect at the market, or we bring it to site.</p>
          </div>
        </div>
      </Section>

      <Section
        tint
        eyebrow="Ready when you are"
        title="Send your list, get your quote."
        sub="Materials list, tile colours, or a pool idea. One message starts it."
      >
        <CtaRow href={waQuote()} label="Get a quote" />
      </Section>
    </>
  );
}
