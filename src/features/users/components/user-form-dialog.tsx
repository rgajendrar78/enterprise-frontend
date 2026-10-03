"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { SelectField } from "@/components/shared/select-field";
import { TextField } from "@/components/shared/text-field";
import { ACTIVE_OPTIONS, BOOLEAN_VALUE, PERMISSION, ROLE, ROLE_OPTIONS } from "@/constants/app";
import { type UserFormValues, userFormSchema } from "@/features/users/data/user-form-schema";
import { useChangeUserRole, usersApi } from "@/features/users/services/use-users";
import { usePermission } from "@/hooks/use-permission";
import type { User } from "@/types/user";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const mode = user ? "edit" : "create";
  const { can, user: signedIn } = usePermission();

  // The API guards role with its own permission and refuses your own. Creating always
  // sets one; editing offers it only when both hold.
  const canSetRole =
    mode === "create" || (can(PERMISSION.USERS_MANAGE_ROLE) && user?.id !== signedIn?.id);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema(mode)),
    values: {
      name: user?.profile?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? ROLE.USER,
      isActive: user?.isActive === false ? BOOLEAN_VALUE.FALSE : BOOLEAN_VALUE.TRUE,
      password: "",
    },
  });

  const create = usersApi.useCreate();
  const update = usersApi.useUpdate();
  const changeRole = useChangeUserRole();

  const save = async (values: UserFormValues) => {
    if (!user) {
      await create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password ?? "",
        role: values.role,
      });
      return;
    }

    // Two calls, because role has its own endpoint. Only when it actually changed, so an
    // ordinary edit stays one request.
    if (canSetRole && values.role !== user.role) {
      await changeRole.mutateAsync({ id: user.id, role: values.role });
    }
    await update.mutateAsync({
      id: user.id,
      data: {
        name: values.name,
        email: values.email,
        isActive: values.isActive === BOOLEAN_VALUE.TRUE,
      },
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "Edit user" : "New user"}
      description={user ? "Changes apply immediately." : "They can sign in as soon as you save."}
      form={form}
      onSubmit={save}
    >
      <TextField control={form.control} name="name" label="Name" autoComplete="name" />
      <TextField
        control={form.control}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
      />

      {mode === "create" ? (
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        {canSetRole ? (
          <SelectField
            control={form.control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            className="flex-1"
          />
        ) : null}

        {mode === "edit" ? (
          <SelectField
            control={form.control}
            name="isActive"
            label="Status"
            options={ACTIVE_OPTIONS}
            className="flex-1"
          />
        ) : null}
      </div>
    </FormDialog>
  );
}
