import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
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
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
