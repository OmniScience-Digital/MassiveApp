// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";

const protectedRoutes = [
  "/landing",
  "/auditing",
  "/csvparser",
  "/auditinDashboard",
  "/dashboard",
  "/stockpileDashboard",
  "/telegramreporting",
  "/stockpilereporting",
  "/progressivereporting",
  "/sitesimulator",
  "/admin",
];

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isPublicRoute = path === "/";

  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  let authenticated = false;
  let isAdmin = false;

  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (context) => {
        try {
          const session = await fetchAuthSession(context, {});
          const groups =
            (session.tokens?.idToken?.payload["cognito:groups"] as
              | string[]
              | undefined) ?? [];
          return { authed: !!session.tokens, admin: groups.includes("ADMIN") };
        } catch {
          return { authed: false, admin: false };
        }
      },
    });
    authenticated = result.authed;
    isAdmin = result.admin;
  } catch {
    authenticated = false;
  }

  if (isProtectedRoute && !authenticated) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (path.startsWith("/admin") && authenticated && !isAdmin) {
    return NextResponse.redirect(new URL("/landing", request.nextUrl));
  }

  if (isPublicRoute && authenticated) {
    return NextResponse.redirect(new URL("/landing", request.nextUrl));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.jpg$|.*\\.webp$).*)"],
};