import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === '/login';
  const isDashboard = pathname.startsWith('/dashboard');

  function redirectWithSessionCookies(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'private, no-store');

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  }

  function getSafeDashboardUrl() {
    const url = request.nextUrl.clone();
    const nextPath = request.nextUrl.searchParams.get('next');

    if (!nextPath || !nextPath.startsWith('/dashboard')) {
      url.pathname = '/dashboard';
      url.search = '';
      return url;
    }

    const nextUrl = new URL(nextPath, request.url);
    url.pathname = nextUrl.pathname;
    url.search = nextUrl.search;
    return url;
  }

  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return redirectWithSessionCookies(url);
  }

  if (user && isAuthPage) {
    return redirectWithSessionCookies(getSafeDashboardUrl());
  }

  return supabaseResponse;
}
