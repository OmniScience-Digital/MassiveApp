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
];
const publicRoutes = ["/"];

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );
  const isPublicRoute = publicRoutes.includes(path);

  let authenticated = false;

  try {
    // Use the response object as required by Amplify
    const response = NextResponse.next();
    
    authenticated = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (context) => {
        try {
          const session = await fetchAuthSession(context, {});
          return !!session.tokens;
        } catch {
          return false;
        }
      },
    });
  } catch {
    authenticated = false;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !authenticated) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  // Redirect authenticated users away from public routes
  if (isPublicRoute && authenticated && !path.startsWith("/landing")) {
    return NextResponse.redirect(new URL("/landing", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};