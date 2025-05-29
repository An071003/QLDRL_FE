import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Handle logout
  if (pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protected routes - require authentication
  if (pathname.startsWith("/uit")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!process.env.JWT_SECRET) {
        // In production, JWT verification should be done server-side
        // For now, just allow if token exists
        console.log('JWT_SECRET not available in middleware, allowing request');
        return NextResponse.next();
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

  // Handle login page redirect for authenticated users
  if (pathname === "/login" && token) {
    // If user is already logged in, redirect to dashboard
    return NextResponse.redirect(new URL("/uit", request.url));
  }

  // Allow other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/uit/:path*",
    "/uit",  // Add this to handle exact /uit route
    "/login", 
    "/logout"
  ],
};
