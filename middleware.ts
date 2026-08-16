import { NextResponse, type NextRequest } from "next/server";
import { ROLE_ALLOWED_PREFIXES, SESSION_COOKIE_NAME, verifySessionToken, roleHomePath } from "@/lib/session";

const ROLE_RESTRICTED_PREFIXES = ["/admin", "/portal"];
/** Rotas que exigem apenas uma sessão válida, sem restrição por papel. */
const AUTHENTICATED_ONLY_PREFIXES = ["/conta"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isRoleRestricted = ROLE_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthenticatedOnly = AUTHENTICATED_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isRoleRestricted && !isAuthenticatedOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticatedOnly) {
    return NextResponse.next();
  }

  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[session.role] ?? [];
  const hasAccess = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!hasAccess) {
    return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/conta/:path*"],
};
