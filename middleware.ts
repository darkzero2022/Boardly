import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// NextAuth v5 uses "authjs.session-token" in dev and "__Secure-authjs.session-token" in prod
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/auth/totp/check") ||
    pathname.startsWith("/api/auth/totp/verify") ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Skip setup check if cookie already set (fast path for existing installs)
  const setupDone = req.cookies.get("setup_complete")?.value === "1";
  if (!setupDone && !pathname.startsWith("/api/")) {
    try {
      const setupRes = await fetch(new URL("/api/setup", req.url));
      const { needed } = await setupRes.json();
      if (needed) return NextResponse.redirect(new URL("/setup", req.url));
    } catch {
      // If setup check fails, continue normally — don't block the app
    }
  }

  // Check JWT token (works in Edge runtime — no Prisma needed)
  // NextAuth v5 changed cookie name from "next-auth.session-token" → "authjs.session-token"
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // VIEWER role: block all mutating API calls
  if (
    token.role === "VIEWER" &&
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    return NextResponse.json({ error: "Read-only access" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
