import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/constants/routes";

export default function HomePage() {
  redirect(DEFAULT_AUTHENTICATED_ROUTE);
}
