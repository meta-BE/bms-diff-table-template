import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (ua.startsWith("Java/")) {
    return NextResponse.rewrite(new URL("/_parser", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
