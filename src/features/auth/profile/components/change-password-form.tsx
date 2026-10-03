import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  type ChangePasswordValues,
  changePasswordSchema,
} from "@/features/auth/data/password-schemas";
import { useChangePassword } from "@/features/auth/services/use-password";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const EMPTY: ChangePasswordValues = { currentPassword: "", password: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const change = useChangePassword(() => form.reset(EMPTY));
  const submit = form.handleSubmit((values) => change.mutate(values));

  useUnsavedChanges(form.formState.isDirty);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        <TextField
          control={form.control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={change.isPending} disabled={!form.formState.isDirty}>
            Change password
          </Button>
        </div>
      </form>
    </Form>
  );
}
