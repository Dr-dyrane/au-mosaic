"use client";

import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { IconClose, IconEye } from "@/app/admin/(panel)/icons";

type PhotoAction = {
  href: string;
  label: string;
};

export default function AdminPhotoViewer({
  src,
  alt,
  title,
  eyebrow = "Photo",
  description,
  actions = [],
  triggerLabel,
  triggerClassName,
  children,
  unoptimized,
}: {
  src: string;
  alt: string;
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: PhotoAction[];
  triggerLabel?: string;
  triggerClassName: string;
  children: React.ReactNode;
  unoptimized?: boolean;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={triggerLabel ?? `View ${title}`}
          className={`admin-photo-trigger ${triggerClassName}`}
        >
          {children}
          <span className="admin-photo-trigger-prompt">
            <IconEye className="h-4 w-4" />
            <span>View</span>
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <div className="admin-photo-root fixed inset-0">
          <Dialog.Overlay className="admin-photo-scrim absolute inset-0" />
          <Dialog.Content className="admin-photo-content outline-none">
            <div className="admin-photo-frame">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1279px) 76vw, 62vw"
                className="object-contain"
                unoptimized={unoptimized}
                priority
              />
            </div>
            <div className="admin-photo-info liquid-glass">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="eyebrow">{eyebrow}</p>
                  <Dialog.Title className="font-serif mt-3 text-[20px] leading-tight">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description
                    className={description ? "mt-3 text-[14px] leading-relaxed text-dusk" : "sr-only"}
                  >
                    {description ?? "Photo preview."}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Close photo"
                  className="admin-glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dusk hover:text-ink"
                >
                  <IconClose className="h-4 w-4" />
                </Dialog.Close>
              </div>
              {actions.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
                  {actions.map((action) => (
                    <Link key={action.href} href={action.href} className="link-hair text-dusk text-[12px]">
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
