import type { ComponentType } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  isLoading?: boolean;
  href?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  isLoading = false,
  href,
}: StatCardProps) {
  const content = (
    <Card className={cn("h-full", href && "cursor-pointer transition-shadow hover:shadow-md")}>
      <CardContent className="flex h-full items-center justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          )}
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
        {Icon ? <Icon className="text-muted-foreground size-6 shrink-0" /> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
