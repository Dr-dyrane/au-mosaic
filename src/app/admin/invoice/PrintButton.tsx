"use client";

import { buzz } from "@/lib/backoffice";

/* One gold button, and the browser does the rest: print it, or save
   it as a PDF from the same sheet. No dependency ever learned to
   make paper better than the platform. */

export default function PrintButton() {
  return (
    <button
      onClick={() => {
        buzz(4);
        window.print();
      }}
      className="btn-gold print-hide"
    >
      Print or save as PDF
    </button>
  );
}
