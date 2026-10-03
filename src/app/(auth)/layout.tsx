import type { ReactNode } from "react";

/** One centred column for every signed-out screen. In the route-group layout so the
 *  auth screens cannot drift apart, and a new one gets it for free. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="grid min-h-screen place-items-center p-6">{children}</main>;
}
