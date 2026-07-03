/* Remounts on every navigation, so each page glides in. Pure CSS,
   respects reduced motion, zero libraries. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
