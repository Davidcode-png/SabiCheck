import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !request.cookies.has(REFRESH_TOKEN_COOKIE)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
