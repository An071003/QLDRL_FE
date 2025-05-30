import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (request.nextUrl.pathname === "/logout" && request.method === "POST") {
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", "", {
      path: "/",
      expires: new Date(0)
    });
    return response;
  }

  if (request.nextUrl.pathname === "/logout" && request.method === "GET") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    if (request.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
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
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/uit/:path*", "/logout"],
};
