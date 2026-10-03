import Link from "next/link";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">404</p>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link
          href={DEFAULT_AUTHENTICATED_ROUTE}
          className="text-primary text-sm underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
