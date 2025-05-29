import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname === "/logout" && request.method === "POST") {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  }

  if (pathname === "/logout" && request.method === "GET") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    if (pathname !== "/login" && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
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
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/uit/:path*", "/login", "/logout"],
};
