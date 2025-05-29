import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
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
        
        let redirectPath = "/uit/student"; // default path
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
        // If token is invalid, clear it and continue to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
      }
    }
    return NextResponse.next();
  }

  // Handle logout
  if (pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protected routes
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

    // Role-based access control
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

    return NextResponse.next();
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
    '/unauthorized'
  ]
};
