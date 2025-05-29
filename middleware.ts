import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  console.log('Request path:', request.nextUrl.pathname);
  console.log('Token present:', !!token);

  // Handle logout
  if (request.nextUrl.pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle no token case
  if (!token) {
    if (request.nextUrl.pathname !== "/login") {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.next();
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      throw new Error('JWT_SECRET is not defined');
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { role: string };
    const pathname = request.nextUrl.pathname;

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

    const response = NextResponse.next();
    // Preserve token with proper settings
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    return response;
  } catch (error) {
    console.error('Error in middleware:', error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/uit/:path*", "/login", "/logout"],
};
