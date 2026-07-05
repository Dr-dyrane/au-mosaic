# Infinite scroll — the long lists

Owner's ask: no page buttons, no endless single fetch. Render a set, and as the
reader nears the end, auto-load the next batch — skeletons hold the grid while
it flies in, then the real cards replace them. Instagram-style, smooth.

The engine is built and lives in `src/components/InfiniteList.tsx` (Claude's
lane, done, `tsc`-clean). It owns the scroll, the state, and the loaders, and
nothing about the data. The **data wiring is CODEX's** — it owns these pages and
can test the queries against the database, which Claude's sandbox can't reach.

## The component

```tsx
<InfiniteList
  initial={firstPage}            // server-rendered first slice
  initialDone={!hasMore}         // true if the first slice is the whole list
  loadMore={boundAction}         // (offset) => Promise<{ items, done }>
  renderItem={(row) => <Card key={row.id} … />}
  renderSkeleton={(i) => <div key={i} className="skel aspect-[4/5] rounded-[22px]" />}
  skeletonCount={6}              // ~= grid columns
  className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
/>
```

`renderItem` and `renderSkeleton` are the grid's direct children — same grid
classes the page already uses. Skeletons reuse the existing `.skel` shimmer
(globals.css), which already stands down under `prefers-reduced-motion`.

## The load-more action (CODEX)

One `"use server"` action per list, paginated by `limit + offset`. Ask for one
more than the page so you know if the list ends, without a second count query:

```ts
"use server";
const PAGE = 24;

export async function loadMorePhotos(
  filters: MediaFilters,
  offset: number,
): Promise<{ items: PhotoRow[]; done: boolean }> {
  const rows = await getDb()
    .select({ /* … same shape the page maps … */ })
    .from(schema.mediaAssets)
    .where(and(...whereFrom(filters)))
    .orderBy(desc(schema.mediaAssets.createdAt))
    .limit(PAGE + 1)
    .offset(offset);
  return { items: rows.slice(0, PAGE), done: rows.length <= PAGE };
}
```

Bind the current filters into the action in the server component and pass it
straight through:

```tsx
const firstPage = rows.slice(0, PAGE);
<InfiniteList
  key={activeFilterKey}                 // reset when filters change (see below)
  initial={firstPage}
  initialDone={rows.length <= PAGE}
  loadMore={loadMorePhotos.bind(null, filters)}
  …
/>
```

Keep the ORDER BY stable and offset-safe (e.g. `createdAt desc, id desc`) so
rows don't shift between batches.

## The lists to convert

- **Photos** (`/admin/media`) — biggest win, ~228 rows. Grid, PAGE 24.
- **Stock** (`/admin/pieces`) — grid, PAGE 24. Note: today it groups by range;
  either paginate within the flat list, or keep the grouped view for filtered
  subsets and infinite-scroll the "everything" view.
- **Orders** (`/admin/orders`), **People** (`/admin/customers`),
  **Owed** (`/admin/debts`), **Deliveries** — row lists, PAGE ~30, row
  skeleton `className="skel h-16 rounded-[22px]"`.

## Filters + reset

When a filter changes the URL, the server re-renders the first page. Put a
`key` on `<InfiniteList>` derived from the active filter string so it remounts
with the fresh first page instead of appending onto a stale one.

## Lanes

- **Claude:** `InfiniteList.tsx` (done, hands off). Happy to add row/grid
  skeleton helpers if useful.
- **CODEX:** the `loadMore*` actions, the first-page slice on each page, the
  skeleton shapes, and verification against the database.
