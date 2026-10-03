import type { Metadata } from "next";
import { ProfilePage } from "@/features/auth/profile";

export const metadata: Metadata = { title: "My Profile" };

export default function Page() {
  return <ProfilePage />;
}
