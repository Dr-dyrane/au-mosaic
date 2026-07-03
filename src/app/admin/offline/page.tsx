/* The calm room the service worker shows when the network is gone.
   Static on purpose: it must render with no database and no session. */

export const metadata = { title: "Offline" };

export default function AdminOffline() {
  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col items-start justify-center px-5 sm:px-8">
      <p className="eyebrow">Offline</p>
      <h1 className="font-serif text-display-section mt-4 max-w-xl">
        The book needs a connection.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
        Nothing is lost. Find network, pull down to refresh, and the house
        picks up where it left off.
      </p>
    </main>
  );
}
