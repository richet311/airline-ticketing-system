import { NextResponse, type NextRequest } from "next/server";

import { employeeHome, employeePages } from "@/lib/roles";
import { employeeFromSessionCookie, SESSION_COOKIE } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const employee = await employeeFromSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
  if (!employee || employeePages(employee.job_role_name).includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(employeeHome(employee.job_role_name), request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
