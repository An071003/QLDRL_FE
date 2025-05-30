import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname === "/logout") {
    if (request.method === "POST") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle login page - redirect authenticated users to their dashboard
  if (pathname === "/login") {
    if (token) {
      try {
        if (!process.env.JWT_SECRET) {
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.headers.set('X-Debug-Middleware', 'No JWT_SECRET, redirecting to login for security');
          response.headers.set('X-Debug-Token', token ? 'exists' : 'missing');
          response.cookies.delete("token");
          return response;
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

        const response = NextResponse.redirect(new URL(redirectPath, request.url));
        response.headers.set('X-Debug-Middleware', `Login redirect: role=${role}, path=${redirectPath}`);
        response.headers.set('X-Debug-Role', role);
        response.headers.set('X-Debug-Token', 'valid');
        return response;
      } catch (error) {
        const response = NextResponse.next();
        response.cookies.delete("token");
        response.headers.set('X-Debug-Middleware', 'Invalid token on login, clearing cookie');
        response.headers.set('X-Debug-Token', 'invalid');
        response.headers.set('X-Debug-Error', String(error));
        return response;
      }
    }
    const response = NextResponse.next();
    response.headers.set('X-Debug-Middleware', 'Login page, no token');
    response.headers.set('X-Debug-Token', 'missing');
    return response;
  }

  // Handle exact /uit route - redirect to role-specific dashboard
  if (pathname === "/uit") {
    if (!token) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.headers.set('X-Debug-Middleware', 'No token at /uit, redirecting to login');
      response.headers.set('X-Debug-Token', 'missing');
      return response;
    }

    try {
      if (!process.env.JWT_SECRET) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.headers.set('X-Debug-Middleware', 'No JWT_SECRET at /uit, redirecting to login for security');
        response.headers.set('X-Debug-Token', token ? 'exists' : 'missing');
        response.cookies.delete("token");
        return response;
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

      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      response.headers.set('X-Debug-Middleware', `UIT redirect: role=${role}, path=${redirectPath}`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Token', 'valid');
      return response;
    } catch (error) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      response.headers.set('X-Debug-Middleware', `Error at /uit: ${error}`);
      response.headers.set('X-Debug-Token', 'invalid');
      response.headers.set('X-Debug-Error', String(error));
      return response;
    }
  }

  // Protected routes with role-based access control
  if (pathname.startsWith("/uit/")) {
    if (!token) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.headers.set('X-Debug-Middleware', `No token at ${pathname}, redirecting to login`);
      response.headers.set('X-Debug-Token', 'missing');
      return response;
    }

    try {
      if (!process.env.JWT_SECRET) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.headers.set('X-Debug-Middleware', `No JWT_SECRET at ${pathname}, redirecting to login for security`);
        response.headers.set('X-Debug-Token', token ? 'exists' : 'missing');
        response.cookies.delete("token");
        return response;
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const { role } = payload as { role: string };

      // Role-based access control
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

      const response = NextResponse.next();
      response.headers.set('X-Debug-Middleware', `Access granted to ${pathname} for role: ${role}`);
      response.headers.set('X-Debug-Role', role);
      response.headers.set('X-Debug-Token', 'valid');
      return response;
    } catch (error) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      response.headers.set('X-Debug-Middleware', `Error in middleware: ${error}`);
      response.headers.set('X-Debug-Token', 'invalid');
      response.headers.set('X-Debug-Error', String(error));
      return response;
    }
  }

  // Allow all other routes
  const response = NextResponse.next();
  response.headers.set('X-Debug-Middleware', `Allowing access to ${pathname}`);
  response.headers.set('X-Debug-Token', token ? 'exists' : 'missing');
  return response;
}

export const config = {
  matcher: [
    "/uit/:path*",
    "/uit",
    "/login", 
    "/logout"
  ],
};
