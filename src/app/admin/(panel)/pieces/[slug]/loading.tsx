/* The piece record's breath: back, name, the photo pair, then the
   form blocks, exactly where they will stand. */

export default function PieceLoading() {
  return (
    <main aria-busy="true" aria-label="Opening the piece">
      <div className="skel h-4 w-28 !rounded-full" />
      <div className="skel mt-6 h-9 w-72" />
      <div className="skel mt-3 h-3 w-48" />
      <div className="skel mt-8 h-64 max-w-3xl !rounded-[28px]" />
      <div className="mt-8 grid max-w-3xl gap-8">
        <div className="skel h-72 !rounded-[28px]" />
        <div className="skel h-44 !rounded-[28px]" />
      </div>
    </main>
  );
}
