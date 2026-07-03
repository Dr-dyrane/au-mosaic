/* Rooms open with a breath, not a blank. Three quiet panels where
   the content is about to be. */

export default function AdminLoading() {
  return (
    <main aria-busy="true" aria-label="Opening the room">
      <div className="h-3 w-24 rounded-full bg-shell/60" />
      <div className="mt-5 h-9 w-64 rounded-full bg-shell/60" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel h-36 animate-pulse bg-shell/40" />
        ))}
      </div>
    </main>
  );
}
