import type { Metadata } from "next";
import { UserDetailPage } from "@/features/users/user-detail";

export const metadata: Metadata = { title: "User" };

/** Dynamic params are a Promise in Next 16 — awaited here, in the server component. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetailPage id={id} />;
}
