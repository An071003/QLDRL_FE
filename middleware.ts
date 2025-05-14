import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    if (request.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/logout") {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("token");
    return response;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret); 
    const { role } = payload as { role: string };
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/uit/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/student") && role !== "student") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/uit/lecturer") && role !== "lecturer") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/uit/:path*", "/logout"],
};
