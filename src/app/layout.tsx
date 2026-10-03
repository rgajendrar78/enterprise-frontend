import type { ReactNode } from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { env } from "@/config/env";
import { THEME } from "@/constants/config";

/** Runs before first paint, so no theme flash. Resolving "system" here rather than in
 *  CSS keeps `globals.css` to one dark block; inline because a `src` loads too late. */
const applyThemeBeforePaint = `
(function(){try{
  var stored = localStorage.getItem(${JSON.stringify(THEME.STORAGE_KEY)});
  var dark = stored === ${JSON.stringify(THEME.DARK)} ||
    ((!stored || stored === ${JSON.stringify(THEME.SYSTEM)}) &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark
    ? ${JSON.stringify(THEME.DARK)}
    : ${JSON.stringify(THEME.LIGHT)};
}catch(e){}})();
`;

export const metadata: Metadata = {
  title: { default: env.NEXT_PUBLIC_APP_NAME, template: `%s · ${env.NEXT_PUBLIC_APP_NAME}` },
  description: "Enterprise admin application",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyThemeBeforePaint }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
