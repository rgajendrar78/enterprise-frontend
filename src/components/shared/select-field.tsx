"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { SearchableSelect, type SelectOption } from "@/components/shared/searchable-select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: SelectOption[];
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Layout only — `flex-1` when the field shares a row. */
  className?: string;
}

/** `<TextField>` for a list of choices. The value is always a string, so an enum reaches
 *  the form as its own value and a boolean as `BOOLEAN_VALUE.TRUE` / `.FALSE`. */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  placeholder,
  disabled,
  className,
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <SearchableSelect
              options={options}
              value={String(field.value ?? "")}
              onChange={field.onChange}
              placeholder={placeholder}
              searchPlaceholder={`Search ${label.toLowerCase()}…`}
              disabled={disabled}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
