import { getToken } from "@auth/core/jwt";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/auth";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name)?.value);
}

/** Clears invalid session cookies when JWT is invalid (e.g. after AUTH_SECRET change), so auth() never logs JWTSessionError. */
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (hasSessionCookie(request) && process.env.AUTH_SECRET) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: request.nextUrl.protocol === "https:",
    });
    if (!token) {
      const response = NextResponse.redirect(request.url);
      for (const name of SESSION_COOKIE_NAMES) {
        response.cookies.set(name, "", { maxAge: 0, path: "/" });
      }
      return response;
    }
  }
  // NextAuth auth() is typed for route handlers (expects params); middleware receives NextFetchEvent. Cast to satisfy types.
  return auth((req) => NextResponse.next())(request, event as unknown as { params: Promise<Record<string, string>> });
}
