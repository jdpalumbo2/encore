import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "encore_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// UUID v4 generator that runs in the Edge runtime (no Node crypto module).
function uuidv4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (const b of bytes) hex.push(b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function basicAuthOk(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  // Format: "user:password". User part is ignored; we only check password.
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  const password = decoded.slice(idx + 1);
  return password === expected;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin-area auth gate. Tight matcher; explicitly excludes /api/curate
  // and /api/track. Returns 401 with WWW-Authenticate so browsers prompt.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!basicAuthOk(req)) {
      return new NextResponse("Authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Encore Admin"',
        },
      });
    }
    return NextResponse.next();
  }

  // Customer-facing routes: ensure encore_sid cookie is set.
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, uuidv4(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return res;
}

export const config = {
  // Match all paths except Next internals and static files. The /api/curate
  // and /api/track routes are matched (they need the session cookie to be
  // readable on first request), but they don't trigger the admin auth branch.
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
