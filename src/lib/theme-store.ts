/* One theme store. The toggle writes, everything that cares subscribes:
   the toggle icon, and every ThemeImage that swaps night frames for day. */

let listeners: Array<() => void> = [];

export const subscribeTheme = (fn: () => void) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};

export const getIsLight = () =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light";

export const notifyTheme = () => listeners.forEach((l) => l());
