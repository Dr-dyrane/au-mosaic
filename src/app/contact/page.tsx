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
      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <p className="eyebrow">Contact</p>
        <h1 className="font-serif mt-4 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] leading-[1.06]">
          Come see the stock. Or just message.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          Most of the house&apos;s business happens on WhatsApp: photos,
          prices, delivery. Start there.
        </p>
        <div className="mt-8">
          <CtaRow href={waGeneral()} label="Chat on WhatsApp" />
        </div>
      </section>

      <Section title="The showroom">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="hairline pt-6">
            <p className="eyebrow">Where</p>
            <p className="font-serif mt-3 text-[20px]">{SITE.location}</p>
            <p className="mt-1.5 text-[14px] text-dusk">Ask any trader for AU Mosaic.</p>
          </div>
          <div className="hairline pt-6">
            <p className="eyebrow">When</p>
            <p className="font-serif mt-3 text-[20px]">{SITE.hours}</p>
            <p className="mt-1.5 text-[14px] text-dusk">Sundays, we rest.</p>
          </div>
          <div className="hairline pt-6">
            <p className="eyebrow">Delivery</p>
            <p className="font-serif mt-3 text-[20px]">Pickup or delivery</p>
            <p className="mt-1.5 text-[14px] text-dusk">Collect at the market, or we bring it to site.</p>
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
