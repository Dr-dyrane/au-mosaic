"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { RefObject } from "react";
import { IconClose } from "@/app/admin/(panel)/icons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraError: string | null;
  onCapture: () => void;
}

export default function CameraDialog({ open, onOpenChange, videoRef, cameraError, onCapture }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-sand/80" />
        <Dialog.Content className="fixed inset-0 z-[91] overflow-hidden bg-sand outline-none">
          <Dialog.Title className="sr-only">Camera capture</Dialog.Title>
          <Dialog.Description className="sr-only">
            Point the camera at the surface, capture a still, then refine the visualizer.
          </Dialog.Description>
          <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-8">
            <div className="glass pointer-events-auto max-w-[min(360px,calc(100vw-104px))] px-5 py-4">
              <p className="eyebrow">Camera</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                Capture the surface once. We refine it after.
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close camera"
                className="glass pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:text-gold"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <div className="glass pointer-events-auto mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-5 px-5 py-4 sm:justify-between">
              <div className="min-w-[180px] flex-1">
                <p className="eyebrow">Capture</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-mist">
                  {cameraError ?? "Take one still. Then the surface stays editable."}
                </p>
              </div>
              <button type="button" onClick={onCapture} className="btn-gold">
                Capture photo
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
