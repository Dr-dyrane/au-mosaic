"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* The museum hold: media leans a degree or two toward the pointer, like a
   piece under glass. On phones the gyroscope does it physically, where the
   browser allows it without a permission dance (Android does; iOS stays
   still rather than interrupt). Reduced motion stands everything down,
   and the slight overscale means edges never show. */
export default function TiltFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    if (typeof (DeviceOrientationEvent as unknown as DOE).requestPermission === "function") return;
    const el = ref.current;
    if (!el) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const ry = Math.max(-3, Math.min(3, e.gamma / 12));
      const rx = Math.max(-3, Math.min(3, (45 - e.beta) / 14));
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 2.2).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 2.2).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt ${className}`}>
      {children}
    </div>
  );
}
