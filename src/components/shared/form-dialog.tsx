"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useConfirm } from "@/components/shared/confirm-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DISCARD_CHANGES_PROMPT } from "@/constants/config";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  form: UseFormReturn<T>;
  /** Must **await** its mutations: the dialog closes when this resolves, stays open and
   *  keeps the input when it rejects (the failure is already toasted globally). */
  onSubmit: (values: T) => Promise<unknown> | void;
  submitLabel?: string;
  children: ReactNode;
}

export function FormDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  submitLabel = "Save",
  children,
}: Props<T>) {
  const confirm = useConfirm();

  useUnsavedChanges(open && form.formState.isDirty);

  /** Always resets on the way out, or a create form reopens holding the last input:
   *  `values` re-syncs on a row change, and create-to-create there is none. */
  const close = () => {
    form.reset();
    onOpenChange(false);
  };

  const requestClose = async () => {
    if (form.formState.isDirty && !(await confirm(DISCARD_CHANGES_PROMPT))) return;
    close();
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch {
      return;
    }
    close();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : void requestClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
            {children}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void requestClose()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
