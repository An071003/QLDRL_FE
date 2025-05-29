import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;
  
  // Log chi tiết
  console.log('=== MIDDLEWARE LOG ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Path:', pathname);
  console.log('Method:', request.method);
  console.log('User-Agent:', request.headers.get('user-agent'));
  console.log('Has Token:', !!token);
  console.log('All Cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 20)}...`));
  console.log('======================');

  if (pathname === "/logout" && request.method === "POST") {
    console.log('LOGOUT POST detected');
    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  }

  if (pathname === "/logout" && request.method === "GET") {
    console.log('LOGOUT GET detected - redirecting to login');
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    if (pathname !== "/login" && pathname !== "/") {
      console.log('No token found - redirecting to login from:', pathname);
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log('No token but accessing allowed page:', pathname);
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
    console.log('Token verified - User role:', role, 'accessing:', pathname);

    // Role-based access control with logging
    if (pathname.startsWith("/uit/admin") && role !== "admin") {
      console.log('UNAUTHORIZED: Admin access denied for role:', role);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/student") && role !== "student") {
      console.log('UNAUTHORIZED: Student access denied for role:', role);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/advisor") && role !== "advisor") {
      console.log('UNAUTHORIZED: Advisor access denied for role:', role);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/department-officers") && role !== "departmentofficer") {
      console.log('UNAUTHORIZED: Department officer access denied for role:', role);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/class-leader") && role !== "classleader") {
      console.log('UNAUTHORIZED: Class leader access denied for role:', role);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    
    console.log('ACCESS GRANTED for role:', role, 'to path:', pathname);
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    console.log('Redirecting to login due to error');
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/uit/:path*", "/login", "/logout"],
};
