import type { Metadata } from "next";
import { UserListPage } from "@/features/users/user-list";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return <UserListPage />;
}
