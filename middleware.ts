import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Skip middleware for RSC requests
  if (request.nextUrl.searchParams.has('_rsc') || 
      request.headers.get('RSC') === '1' || 
      request.headers.get('Next-Router-State-Tree')) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  if (pathname === "/login" || pathname === "/") {
    if (token) {
      // If user is logged in, redirect to default page based on role
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const { role } = payload as { role: string };
        
        let redirectPath = "/uit/student"; 
        switch(role) {
          case "admin":
            redirectPath = "/uit/admin";
            break;
          case "advisor":
            redirectPath = "/uit/advisor";
            break;
          case "departmentofficer":
            redirectPath = "/uit/department-officers";
            break;
          case "classleader":
            redirectPath = "/uit/class-leader";
            break;
        }
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } catch (error) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
      }
    }
    return NextResponse.next();
  }

  if (pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { role: string };

    if (pathname.startsWith("/uit/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/uit/student") && role !== "student") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/uit/advisor") && role !== "advisor") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/uit/department-officers") && role !== "departmentofficer") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/uit/class-leader") && role !== "classleader") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    const response = NextResponse.next();
    // Ensure token is preserved in the response
    if (token && !response.cookies.get('token')) {
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
    }
    return response;
  } catch (error) {
    console.error('Error in middleware:', error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/logout',
    '/uit/:path*',
    '/unauthorized',
    '/_next/data/:path*'
  ]
};
