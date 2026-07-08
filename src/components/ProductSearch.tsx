"use client";

import { useMemo, useState } from "react";
import type { Product, ProductGroup } from "@/lib/products";
import { ProductGroupBlock } from "./ui";

const field =
  "w-full rounded-full bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

function textForItem(item: Product) {
  return [
    item.name,
    item.note,
    ...(item.variants ?? []),
    ...(item.applicationTags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function textForGroup(group: ProductGroup) {
  return [group.title, group.blurb].join(" ").toLowerCase();
}

export default function ProductSearch({ groups }: { groups: ProductGroup[] }) {
  const [query, setQuery] = useState("");
  const clean = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!clean) return groups;
    return groups
      .map((group) => {
        if (textForGroup(group).includes(clean)) return group;
        return {
          ...group,
          items: group.items.filter((item) => textForItem(item).includes(clean)),
        };
      })
      .filter((group) => group.items.length > 0);
  }, [clean, groups]);

  return (
    <div className="space-y-14">
      <div className="max-w-md">
        <label htmlFor="tile-search" className="eyebrow mb-3 block">
          Search tiles
        </label>
        <input
          id="tile-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Aqua, pool, gold, bathroom"
          className={field}
        />
      </div>
      {visible.length > 0 ? (
        visible.map((group) => <ProductGroupBlock key={group.id} group={group} />)
      ) : (
        <p className="max-w-md text-[14px] leading-relaxed text-dusk">
          Nothing matches that search.
        </p>
      )}
    </div>
  );
}
