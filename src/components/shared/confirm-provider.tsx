"use client";

import { type ReactNode, createContext, use, useState } from "react";
import { ConfirmDialog, type ConfirmTone } from "@/components/shared/confirm-dialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** One dialog for the whole app: `if (await confirm({ … })) remove.mutate(id)`. The
 *  alternative is `open`/`pending` state copied into every screen that can delete. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{
    options: ConfirmOptions;
    settle: (confirmed: boolean) => void;
  } | null>(null);

  const confirm: Confirm = (options) =>
    new Promise<boolean>((resolve) => setRequest({ options, settle: resolve }));

  const close = (confirmed: boolean) => {
    request?.settle(confirmed);
    setRequest(null);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <ConfirmDialog
        open={request !== null}
        // Escape, the overlay and Cancel all mean "no".
        onOpenChange={(open) => !open && close(false)}
        onConfirm={() => close(true)}
        {...request?.options}
        title={request?.options.title ?? ""}
      />
    </ConfirmContext>
  );
}

export function useConfirm(): Confirm {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
