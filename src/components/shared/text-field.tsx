"use client";

import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Props<T extends FieldValues> extends Omit<ComponentProps<typeof Input>, "name"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
}

/** The label / control / message trio every text input repeats, in one line instead of
 *  twelve. Anything not a plain input still uses `<FormField>` directly. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...input
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} {...input} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
