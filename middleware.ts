import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Handle logout
  if (pathname === "/logout" && request.method === "POST") {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    response.headers.set('X-Debug-Middleware', 'POST Logout - cookie cleared');
    return response;
  }

  if (pathname === "/logout" && request.method === "GET") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    response.headers.set('X-Debug-Middleware', 'GET Logout - redirecting to login');
    return response;
  }

  // Handle case when no token
  if (!token) {
    if (pathname !== "/login") {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.headers.set('X-Debug-Middleware', `No token at ${pathname}, redirecting to login`);
      return response;
    }
    // Allow access to /login when no token
    const response = NextResponse.next();
    response.headers.set('X-Debug-Middleware', 'No token, allowing access to login');
    return response;
  }

  // Token exists - verify and handle routes
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      response.headers.set('X-Debug-Middleware', 'No JWT_SECRET, clearing token and redirecting');
      return response;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { role: string };

    // Handle /login page when user is already authenticated
    if (pathname === "/login") {
      // Redirect authenticated users to their dashboard
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
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      response.headers.set('X-Debug-Middleware', `Authenticated user at login, redirecting to ${redirectPath}`);
      response.headers.set('X-Debug-Role', role);
      return response;
    }

    // Handle /uit route - redirect to role-specific dashboard
    if (pathname === "/uit") {
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
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      response.headers.set('X-Debug-Middleware', `UIT redirect: role=${role}, path=${redirectPath}`);
      response.headers.set('X-Debug-Role', role);
      return response;
    }

    // Role-based access control for protected routes
    if (pathname.startsWith("/uit/admin") && role !== "admin") {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      response.headers.set('X-Debug-Middleware', `Access denied: ${role} trying to access admin`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Required-Role', 'admin');
      return response;
    }

    if (pathname.startsWith("/uit/student") && role !== "student") {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      response.headers.set('X-Debug-Middleware', `Access denied: ${role} trying to access student`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Required-Role', 'student');
      return response;
    }

    if (pathname.startsWith("/uit/advisor") && role !== "advisor") {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      response.headers.set('X-Debug-Middleware', `Access denied: ${role} trying to access advisor`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Required-Role', 'advisor');
      return response;
    }

    if (pathname.startsWith("/uit/department-officers") && role !== "departmentofficer") {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      response.headers.set('X-Debug-Middleware', `Access denied: ${role} trying to access department-officers`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Required-Role', 'departmentofficer');
      return response;
    }

    if (pathname.startsWith("/uit/class-leader") && role !== "classleader") {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      response.headers.set('X-Debug-Middleware', `Access denied: ${role} trying to access class-leader`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Required-Role', 'classleader');
      return response;
    }

    // Allow access to other routes
    const response = NextResponse.next();
    response.headers.set('X-Debug-Middleware', `Access granted to ${pathname} for role: ${role}`);
    response.headers.set('X-Debug-Role', role);
    return response;

  } catch (error) {
    console.error('Error in middleware:', error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    response.headers.set('X-Debug-Middleware', `JWT error: ${error}`);
    return response;
  }
}

export const config = {
  matcher: ["/uit/:path*", "/uit", "/login", "/logout"],
};
