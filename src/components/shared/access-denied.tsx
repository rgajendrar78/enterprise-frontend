import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { CLIENT_MESSAGE } from "@/constants/errors";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/constants/routes";

/** Shown when a route needs a permission the person does not hold. Without it they
 *  land on a working screen whose every request 403s — a toast beside empty tables. */
export function AccessDenied() {
  return (
    <EmptyState
      icon={ShieldOff}
      title={CLIENT_MESSAGE.FORBIDDEN}
      description="Ask an administrator if you need access to this area."
      action={
        <Button asChild variant="outline">
          <Link href={DEFAULT_AUTHENTICATED_ROUTE}>Back to dashboard</Link>
        </Button>
      }
    />
  );
}
