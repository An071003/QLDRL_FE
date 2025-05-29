import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  console.log('Middleware:', pathname, 'Token exists:', !!token);

  // Handle logout
  if (pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle login page - redirect authenticated users to their dashboard
  if (pathname === "/login") {
    if (token) {
      try {
        if (!process.env.JWT_SECRET) {
          console.log('JWT_SECRET not available, redirecting to default dashboard');
          return NextResponse.redirect(new URL("/uit", request.url));
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const { role } = payload as { role: string };

        // Redirect based on role
        let redirectPath = "/uit/student"; // default
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
          case "student":
            redirectPath = "/uit/student";
            break;
        }

        console.log('User already logged in with role:', role, 'redirecting to:', redirectPath);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } catch (error) {
        console.log('Invalid token on login page, clearing cookie');
        const response = NextResponse.next();
        response.cookies.delete("token");
        return response;
      }
    }
    return NextResponse.next();
  }

  // Handle exact /uit route - redirect to role-specific dashboard
  if (pathname === "/uit") {
    if (!token) {
      console.log('No token, redirecting to login');
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!process.env.JWT_SECRET) {
        console.log('JWT_SECRET not available, allowing access to /uit');
        return NextResponse.next();
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const { role } = payload as { role: string };

      // Redirect to role-specific dashboard
      let redirectPath = "/uit/student"; // default
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
        case "student":
          redirectPath = "/uit/student";
          break;
      }

      console.log('Redirecting from /uit to role-specific dashboard:', redirectPath);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch (error) {
      console.error('Error verifying token on /uit:', error);
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // Protected routes with role-based access control
  if (pathname.startsWith("/uit/")) {
    if (!token) {
      console.log('No token, redirecting to login');
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!process.env.JWT_SECRET) {
        console.log('JWT_SECRET not available, allowing access');
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

      console.log('Access granted to', pathname, 'for role:', role);
      return NextResponse.next();
    } catch (error) {
      console.error('Error in middleware:', error);
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/uit/:path*",
    "/uit",
    "/login", 
    "/logout"
  ],
};
