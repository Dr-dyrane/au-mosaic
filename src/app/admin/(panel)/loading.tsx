/* Rooms open with a breath shaped like a room: title line, action,
   then card pairs under a group label. Skeletons fade in late, so a
   fast answer never shows them. */

export default function AdminLoading() {
  return (
    <main aria-busy="true" aria-label="Opening the room">
      <div className="skel h-3 w-24" />
      <div className="skel mt-5 h-9 w-64" />
      <div className="skel mt-4 h-4 w-72" />
      <div className="skel mt-8 h-11 w-36 !rounded-full" />
      <div className="skel mt-12 h-3 w-32" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel h-28 !rounded-[28px]" />
        ))}
      </div>
    </main>
  );
}
