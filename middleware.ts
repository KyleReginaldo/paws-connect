import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Hard-disable deprecated Forum API routes
  if (pathname.startsWith('/api/v1/forum')) {
    return NextResponse.json(
      { error: 'Forum API has been removed', message: 'This endpoint is no longer available.' },
      { status: 410, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  
  // Define your valid routes (add more as needed)
  const validRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/dashboard',
    '/fundraising',
    '/manage-events',
    '/manage-pet',
    '/manage-users',
  ];
  
  // Define route patterns that should be handled by dynamic routes
  const dynamicRoutePatterns = [
    /^\/fundraising\/\d+$/,  // /fundraising/[id]
    /^\/api\/v1\//,          // All API routes
  ];
  
  // Check if it's a valid static route
  const isValidStaticRoute = validRoutes.includes(pathname);
  
  // Check if it matches a dynamic route pattern
  const isValidDynamicRoute = dynamicRoutePatterns.some(pattern => pattern.test(pathname));
  
  // If it's not a valid route and doesn't match dynamic patterns, it should show 404
  if (!isValidStaticRoute && !isValidDynamicRoute) {
    // Let Next.js handle the 404 naturally by continuing
    // This will trigger the not-found.tsx page
    return NextResponse.next();
  }
  
  // For valid routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Explicitly match Forum API to block it above
    '/api/v1/forum/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
