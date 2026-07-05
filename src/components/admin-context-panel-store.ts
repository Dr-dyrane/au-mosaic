export type AdminContextPanel =
  | {
      kind: "stock-filter";
      current: {
        family?: string;
        low?: string;
        hue?: string;
        app?: string;
        sort?: string;
      };
    }
  | null;

let panel: AdminContextPanel = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAdminContextPanel(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminContextPanel() {
  return panel;
}

export function showStockFilterPanel(current: NonNullable<AdminContextPanel>["current"]) {
  panel = { kind: "stock-filter", current };
  emit();
}

export function clearAdminContextPanel() {
  if (!panel) return;
  panel = null;
  emit();
}
