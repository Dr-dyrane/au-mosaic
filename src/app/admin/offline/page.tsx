/* The field kit. A thin server shell so the title stays server rendered
   (a client component cannot export metadata); the kit itself is a child
   that reads the last saved snapshot from IndexedDB and renders it. */

import OfflineKit from "./OfflineKit";

export const metadata = { title: "Offline" };

export default function AdminOffline() {
  return <OfflineKit />;
}
