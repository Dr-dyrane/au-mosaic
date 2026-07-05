"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { IconClose } from "@/app/admin/(panel)/icons";

export default function AdminSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  id,
  compactOnly = false,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  compactOnly?: boolean;
  role?: "dialog" | "alertdialog";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className={`admin-sheet-root fixed inset-0 ${compactOnly ? "xl:hidden" : ""}`}>
          <Dialog.Overlay className="admin-sheet-scrim filter-scrim absolute inset-0" />
          <Dialog.Content
            id={id}
            role={role}
            className="admin-sheet-content filter-surface liquid-glass max-h-[min(72svh,38rem)] overflow-auto rounded-t-[28px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] outline-none"
          >
            <div className="flex items-start justify-between gap-5 px-2">
              <div>
                <Dialog.Title className="eyebrow">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-2 text-[14px] leading-relaxed text-dusk">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label={`Close ${title.toLowerCase()}`}
                className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="mt-4">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
