"use client";

import Image, { type ImageProps } from "next/image";
import { useSyncExternalStore } from "react";
import { subscribeTheme, getIsLight } from "@/lib/theme-store";

/* The magic: media that follows the light. Dark theme hangs the night
   frame; light theme rehangs the same scene photographed in daylight.
   Slots without a day variant yet simply hold their night frame, so
   pairs ship one at a time. Server renders dark, the house default. */

type Props = Omit<ImageProps, "src"> & { dark: string; light?: string };

export default function ThemeImage({ dark, light, alt, ...rest }: Props) {
  const isLight = useSyncExternalStore(subscribeTheme, getIsLight, () => false);
  const src = isLight && light ? light : dark;
  return <Image key={src} src={src} alt={alt} {...rest} />;
}
