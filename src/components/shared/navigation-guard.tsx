"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/shared/confirm-provider";
import { DISCARD_CHANGES_PROMPT } from "@/constants/config";
import { useUnsavedChangesStore } from "@/stores/unsaved-changes.store";

/** The App Router cannot block navigation, so this catches the click in the capture
 *  phase. Known gap: Back — `popstate` fires too late to stop. Tab close still warns. */
export function NavigationGuard() {
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!useUnsavedChangesStore.getState().hasUnsavedChanges()) return;
      // A modified click opens a new tab; this one keeps its unsaved form.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      void confirm(DISCARD_CHANGES_PROMPT).then((discard) => {
        if (discard) router.push(destination.pathname + destination.search);
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [confirm, router]);

  return null;
}
