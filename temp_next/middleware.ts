import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === '/login';

  const isProtectedRoute =
    pathname.startsWith('/plans') ||
    pathname.startsWith('/plan/');

  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginRoute && isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/plans';

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/login', '/plans/:path*', '/plan/:path*'],
};