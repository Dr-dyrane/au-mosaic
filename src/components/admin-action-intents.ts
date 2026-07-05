export const ADMIN_ACTION_INTENTS = {
  mediaCreate: "media-create",
  mediaBatch: "media-batch",
  orderPayment: "order-payment",
  orderReturn: "order-return",
} as const;

export type AdminActionIntent =
  (typeof ADMIN_ACTION_INTENTS)[keyof typeof ADMIN_ACTION_INTENTS];

export function adminActionEventName(intent: AdminActionIntent) {
  return `admin:action:${intent}`;
}

export function dispatchAdminActionIntent(intent: AdminActionIntent, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(adminActionEventName(intent), { detail }));
}

export function isPlainAdminClick(event: {
  button: number;
  metaKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;
}
