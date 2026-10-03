import { type NextRequest, NextResponse } from "next/server";
import { AUTH } from "@/constants/config";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  PUBLIC_PATHS,
  REDIRECT_PARAM,
  ROUTES,
} from "@/constants/routes";

/** Navigation gate (Next 16 renamed `middleware.ts` -> `proxy.ts`). Cookie presence only, never verification. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);
  const hasToken = Boolean(request.cookies.get(AUTH.COOKIE_NAME)?.value);

  if (!hasToken && !isPublic) {
    const signIn = new URL(ROUTES.signIn, request.url);
    signIn.searchParams.set(REDIRECT_PARAM, pathname);
    return NextResponse.redirect(signIn);
  }

  if (hasToken && isPublic) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
