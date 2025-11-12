// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Redirect untuk (auth)
  if (pathname.startsWith("/(auth)/login")) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (pathname.startsWith("/(auth)/register")) {
    return NextResponse.redirect(`${origin}/register`);
  }

  return NextResponse.next();
}

// Konfigurasi matcher (hanya intercept folder (auth))
export const config = {
  matcher: ["/(auth)/:path*"],
};
