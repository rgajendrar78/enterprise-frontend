import { useRef, useState } from "react";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadToS3 } from "@/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateProfile, useUploadProfileAvatar } from "@/features/auth/services/use-profile";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/utils/cn";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProfileAvatarUpload() {
  const user = useAuthStore((state) => state.user);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getUploadUrl = useUploadProfileAvatar();
  const updateProfile = useUpdateProfile();

  if (!user) return null;

  const initials = user.profile?.name
    ? user.profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPEG, PNG, WEBP, or GIF image.",
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("File too large", {
        description: "The maximum file size is 5MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, imageKey } = await getUploadUrl.mutateAsync({
        contentType: file.type,
      });

      await uploadToS3(uploadUrl, file);

      await updateProfile.mutateAsync({ imageKey });

      toast.success("Profile image updated");
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="group relative">
        <Avatar className="size-24 border">
          <AvatarImage
            src={user.profile?.imageUrl ?? undefined}
            alt={user.profile?.name ?? "User"}
            className="object-cover"
          />
          <AvatarFallback className="bg-field text-2xl">
            {initials || <UserIcon className="text-muted-foreground size-10" />}
          </AvatarFallback>
        </Avatar>

        <label
          className={cn(
            "bg-foreground/60 absolute inset-0 flex cursor-pointer items-center justify-center rounded-full opacity-0 transition-opacity",
            isUploading ? "cursor-not-allowed opacity-100" : "group-hover:opacity-100",
          )}
        >
          {isUploading ? (
            <Loader2 className="text-background size-8 animate-spin" />
          ) : (
            <Camera className="text-background size-8" />
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={ALLOWED_TYPES.join(",")}
            onChange={(event) => void handleFileChange(event)}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}
