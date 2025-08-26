import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/utils/amplifyServerUtils';

const protectedRoutes = [
  "/landing", "/auditing", "/csvparser", "/auditinDashboard",
  "/dashboard", "/stockpileDashboard", "/telegramreporting", "/stockpilereporting"
];
const publicRoutes = ['/'];

export default async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  try {
    const authenticated = await runWithAmplifyServerContext({
      nextServerContext: {request, response},
      operation: async (context) => {
          try{
              const session = await fetchAuthSession(context, {})
              return session.tokens !== undefined
          }catch(err){
              console.log(err)
              return false
          }
      }
  })

 // console.log('authenticated ',authenticated)

    if (isProtectedRoute && !authenticated) {
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    if (isPublicRoute && authenticated && !path.startsWith('/landing')) {
      return NextResponse.redirect(new URL('/landing', request.nextUrl));
    }

  } catch (error) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};