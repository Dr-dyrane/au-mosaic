"use client";

import Image, { type ImageProps } from "next/image";
import { useSyncExternalStore, type ReactNode } from "react";
import { subscribeTheme, getIsLight } from "@/lib/theme-store";

/* A scene is an image with words living on it. The image, its scrim, and
   its typography must flip together: night treatment for night frames in
   both themes, morning treatment only when a daylight twin exists and
   light mode is on. Children carry scene-title, scene-sub, scene-eyebrow,
   scene-link, and scrim-* classes; the vars wrapper does the flipping. */

export function SceneVars({ light, children }: { light?: string; children: ReactNode }) {
  const isLight = useSyncExternalStore(subscribeTheme, getIsLight, () => true);
  const day = isLight && !!light;
  return (
    <div className={`scene-vars ${day ? "scene-day" : ""}`} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

type Props = Omit<ImageProps, "src"> & {
  dark: string;
  light?: string;
  children: ReactNode;
};

export default function SceneFrame({ dark, light, alt, children, ...rest }: Props) {
  const isLight = useSyncExternalStore(subscribeTheme, getIsLight, () => true);
  const day = isLight && !!light;
  const src = day ? (light as string) : dark;
  return (
    <>
      <Image key={src} src={src} alt={alt} {...rest} />
      <div className={`scene-vars ${day ? "scene-day" : ""}`} style={{ display: "contents" }}>
        {children}
      </div>
    </>
  );
}
