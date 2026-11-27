import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PAGES = ['/', '/login', '/register', '/manifest.webmanifest'];
const AUTH_PAGES = ['/login', '/register'];
const PUBLIC_PAGE_PREFIXES = ['/movie/', '/tv/', '/anime/', '/game/', '/person/', '/company/'];
const PUBLIC_API_PATTERNS = [/^\/api\/tv\/\d+\/season\/\d+$/, /^\/api\/anime\/\d+\/episodes$/];

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const isPublicApi = request.method === 'GET' && PUBLIC_API_PATTERNS.some((pattern) => pattern.test(pathname));
    if (!user && !isPublicApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return response;
  }

  if (!user && !PUBLIC_PAGES.includes(pathname) && !startsWithAny(pathname, PUBLIC_PAGE_PREFIXES)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
