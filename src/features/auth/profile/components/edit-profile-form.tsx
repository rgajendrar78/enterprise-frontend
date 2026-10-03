import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DetailField } from "@/components/shared/detail-field";
import { TextField } from "@/components/shared/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/constants/app";
import { ProfileAvatarUpload } from "@/features/auth/profile/components/profile-avatar-upload";
import { type ProfileFormValues, profileSchema } from "@/features/auth/profile/data/profile-schema";
import { useUpdateProfile } from "@/features/auth/services/use-profile";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useAuthStore } from "@/stores/auth.store";

export function EditProfileForm() {
  const user = useAuthStore((state) => state.user);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.profile?.name ?? "",
    },
  });

  // Re-sync if the user updates externally
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.profile?.name || "",
      });
    }
  }, [user, form]);

  const updateProfile = useUpdateProfile();

  const submit = form.handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        // Form becomes pristine with new values
        form.reset(values);
      },
    });
  });

  useUnsavedChanges(form.formState.isDirty);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <ProfileAvatarUpload />

      <Form {...form}>
        <form className="space-y-6" onSubmit={(event) => void submit(event)} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input type="email" value={user.email} disabled />
            </div>
            <DetailField
              label="Role"
              value={
                <Badge variant="secondary" className="font-normal">
                  {ROLE_LABELS[user.role]}
                </Badge>
              }
            />
            <DetailField label="Status" value={<Badge variant="success">Active</Badge>} />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={updateProfile.isPending}
              disabled={!form.formState.isDirty}
            >
              Save changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
