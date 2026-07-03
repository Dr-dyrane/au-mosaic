/* The order record's breath: back, the name, the steps, the lines. */

export default function OrderLoading() {
  return (
    <main aria-busy="true" aria-label="Opening the order">
      <div className="skel h-4 w-28 !rounded-full" />
      <div className="skel mt-6 h-9 w-64" />
      <div className="skel mt-3 h-3 w-44" />
      <div className="mt-10 max-w-3xl">
        <div className="skel h-36 !rounded-[28px]" />
        <div className="skel mt-12 h-3 w-24" />
        <div className="mt-4 grid gap-4">
          <div className="skel h-24 !rounded-[28px]" />
          <div className="skel h-24 !rounded-[28px]" />
        </div>
      </div>
    </main>
  );
}
