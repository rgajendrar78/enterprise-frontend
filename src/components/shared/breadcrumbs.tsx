"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BREADCRUMB_LABELS, DYNAMIC_SEGMENT_LABELS } from "@/constants/navigation";

interface Crumb {
  href: string;
  label: string;
}

/** Derived from the URL, so a screen never renders its own trail and two of them
 *  cannot disagree. Add a label in `constants/navigation.ts`, not here. */
export function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const parent = segments[index - 1];
    const label =
      BREADCRUMB_LABELS[segment] ??
      (parent ? DYNAMIC_SEGMENT_LABELS[parent] : undefined) ??
      segment;

    return { href: `/${segments.slice(0, index + 1).join("/")}`, label };
  });
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  // One crumb is enough: the Home button beside it in the header is the root, so
  // "Users" reads as a trail rather than a label floating on its own.
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="text-muted-foreground flex items-center gap-1 text-sm whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0" aria-hidden /> : null}
              {isLast ? (
                <span aria-current="page" className="text-foreground font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
