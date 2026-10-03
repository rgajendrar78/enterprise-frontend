"use client";

import { API } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks";
import type { ProfileFormValues } from "@/features/auth/profile/data/profile-schema";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types/user";

export function useUpdateProfile() {
  return useApiMutation<AuthUser, Partial<ProfileFormValues>>({
    method: "patch",
    url: API.auth.profile,
    // session query key will be invalidated by useSession when user changes, but let's be explicit
    invalidate: [["session"]],
    onSuccess: (user) => {
      useAuthStore.setState({ user });
    },
  });
}

export function useUploadProfileAvatar() {
  return useApiMutation<{ uploadUrl: string; imageKey: string }, { contentType: string }>({
    method: "post",
    url: API.auth.profileAvatar,
    body: ({ contentType }) => ({ contentType }),
    // Do not invalidate session here, because the image isn't uploaded yet.
    // The component will invalidate the session after the S3 PUT succeeds.
  });
}
