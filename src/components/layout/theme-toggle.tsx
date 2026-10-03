"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

/** One button, no menu: it flips to whichever theme is not showing. The default stays
 *  "system" until the first click, so a fresh visit follows the OS. */
export function ThemeToggle() {
  const { toggle } = useTheme();

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" onClick={toggle}>
      {/* Both render; CSS shows the one matching the resolved theme, so the icon is
          right on the first paint without waiting for hydration. */}
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
