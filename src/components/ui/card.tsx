import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("bg-card text-card-foreground rounded-xl border shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("leading-none font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return (
    <div
      // `pt-0` only when a header already paid for the top padding; a card with
      // content alone would otherwise start flush against its own border.
      className={cn("p-6 [&:not(:first-child)]:pt-0", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex items-center gap-2 p-6 [&:not(:first-child)]:pt-0", className)}
      {...props}
    />
  );
}
