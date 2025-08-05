// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ✅ Attach Supabase session to request
  await createMiddlewareClient({ req, res }).auth.getSession();

  return res;
}

// ✅ Run on all routes (or just API if needed)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
