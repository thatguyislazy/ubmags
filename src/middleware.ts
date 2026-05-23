import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const authPaths = ["/login", "/register", "/forgot-password"];

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-in-production");
}

async function verifyToken(token: string) {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mags_session")?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  const isPublic =
    publicPaths.includes(pathname) ||
    authPaths.some((p) => pathname.startsWith(p)) ||
    pathname === "/api/departments" ||
    pathname.startsWith("/api/auth/");
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthenticated && !isPublic && !pathname.startsWith("/api/auth")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && isAuthenticated) {
    // Role check happens in layout/API — middleware only ensures auth
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
