import { NextResponse, type NextRequest } from "next/server";

import { employeeHome, employeePages } from "@/lib/roles";
import { employeeFromSessionCookie, SESSION_COOKIE } from "@/lib/session";

// Signed-out visitors on a staff page go to the staff login. Signed-in staff stay on their own pages.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const employee = await employeeFromSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);

  if (!employee) {
    const staffPage = pathname === "/employee" || pathname.startsWith("/employee/");
    return staffPage ? NextResponse.redirect(new URL("/login/employee", request.url)) : NextResponse.next();
  }
  if (employeePages(employee.job_role_name).includes(pathname)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(employeeHome(employee.job_role_name), request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
