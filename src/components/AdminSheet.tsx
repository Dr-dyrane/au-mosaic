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
  compactOnly = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  compactOnly?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`admin-sheet-scrim filter-scrim layer-admin-scrim fixed inset-0 ${compactOnly ? "xl:hidden" : ""}`} />
        <Dialog.Content
          id={id}
          className={`admin-sheet-content filter-surface liquid-glass layer-admin-panel fixed inset-x-0 bottom-0 max-h-[min(82svh,44rem)] overflow-auto rounded-t-[28px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] outline-none sm:inset-x-5 sm:bottom-5 sm:mx-auto sm:w-[31rem] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-[28px] sm:pb-5 ${compactOnly ? "xl:hidden" : ""}`}
        >
          <div className="flex items-start justify-between gap-5 px-2">
            <div>
              <Dialog.Title className="eyebrow">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-2 text-[13px] leading-relaxed text-dusk">
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
      </Dialog.Portal>
    </Dialog.Root>
  );
}
