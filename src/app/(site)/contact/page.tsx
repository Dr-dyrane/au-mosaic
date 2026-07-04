import type { Metadata } from "next";
import { BRAND_PROFILE } from "@/lib/brand";
import { getFacts } from "@/lib/facts";
import { SITE } from "@/lib/site";
import { DAY, OWN } from "@/lib/images";
import { waGeneral, waQuote } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact and showroom, Agric Market Lagos",
  description: "Visit the showroom at Agric Market, Lagos, or chat with AU Mosaic on WhatsApp.",
};

export default async function ContactPage() {
  /* The showroom facts read the book he edits, site.ts behind it. */
  const facts = await getFacts();
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Come see the stock. Or just message."
        sub="Most of the house's business happens on WhatsApp: photos, prices, delivery. Start there."
        image={OWN.hammam}
        imageLight={DAY.hammam}
        alt="Warm mosaic hammam under a single shaft of light"
        cta={{ href: waGeneral(), label: "Chat on WhatsApp" }}
      />

      <Section title="The showroom">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="panel">
            <p className="eyebrow">Where</p>
            <p className="font-serif mt-3 text-[20px]">{facts.location}</p>
            <p className="mt-1.5 text-[14px] text-dusk">Ask any trader for AU Mosaic.</p>
          </div>
          <div className="panel">
            <p className="eyebrow">When</p>
            <p className="font-serif mt-3 text-[20px]">{facts.hours}</p>
            <p className="mt-1.5 text-[14px] text-dusk">Sundays, we rest.</p>
          </div>
          <div className="panel">
            <p className="eyebrow">Delivery</p>
            <p className="font-serif mt-3 text-[20px]">Pickup or delivery</p>
            <p className="mt-1.5 text-[14px] text-dusk">Collect at the market, or we bring it to site.</p>
          </div>
        </div>
      </Section>

      <Section
        tint
        eyebrow="From the profile"
        title="Samples begin in chat."
        sub={BRAND_PROFILE.samplePromise}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <a href={waQuote()} target="_blank" rel="noopener" data-wa="cta" className="panel group block">
            <p className="eyebrow">WhatsApp</p>
            <p className="font-serif mt-3 text-[20px] transition-colors duration-300 group-hover:text-gold">
              Ask for samples.
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              Send a tile, colour, room, or materials list.
            </p>
          </a>
          <a href={facts.instagram} target="_blank" rel="noopener" className="panel group block">
            <p className="eyebrow">Instagram</p>
            <p className="font-serif mt-3 text-[20px] transition-colors duration-300 group-hover:text-gold">
              {BRAND_PROFILE.handle}
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              Latest stock, reels, flyers, and home inspiration.
            </p>
          </a>
          <a href={SITE.telegram} target="_blank" rel="noopener" className="panel group block">
            <p className="eyebrow">Telegram</p>
            <p className="font-serif mt-3 text-[20px] transition-colors duration-300 group-hover:text-gold">
              View the sample room.
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              The profile points buyers there for sample viewing.
            </p>
          </a>
        </div>
      </Section>

      <Section
        eyebrow="Ready when you are"
        title="Send your list, get your quote."
        sub="Materials list, tile colours, or a pool idea. One message starts it."
      >
        <CtaRow href={waQuote()} label="Get a quote" />
      </Section>
    </>
  );
}
