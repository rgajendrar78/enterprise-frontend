"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/hooks/use-theme";

/** Mounted once in `app/providers.tsx`. `theme` follows our toggle, not the OS, or a
 *  light toast lands on a dark app; the palette is remapped onto our tokens. */
export function Toaster(props: ToasterProps) {
  const { preference } = useTheme();

  return (
    <Sonner
      theme={preference}
      position="top-right"
      richColors
      closeButton
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
          "--error-border": "var(--destructive)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning)",
          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info)",
          "--border-radius": "var(--radius)",
          // Close button on the trailing edge. Sonner defaults it to the leading
          // one (`start: 0`), which collides with the toast's own icon.
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        } as CSSProperties
      }
      {...props}
    />
  );
}
