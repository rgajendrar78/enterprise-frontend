import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description: ReactNode;
  children?: ReactNode;
  footer?: { href: string; label: string };
}

/** The card itself. Centring is the `(auth)` layout's job. */
export function AuthCard({ title, description, children, footer }: Props) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer ? (
          <p className="text-muted-foreground text-center text-sm">
            <Link href={footer.href} className="hover:text-foreground underline underline-offset-4">
              {footer.label}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
