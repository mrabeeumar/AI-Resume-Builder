import { NextResponse } from "next/server";

import { auth } from "@/auth";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/features",
  "/templates",
  "/pricing",
  "/resources",
  "/about",
  "/blog",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/security",
  "/cookies",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/api/auth");

  if (!req.auth && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
