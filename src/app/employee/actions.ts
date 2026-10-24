"use server";

import { redirect } from "next/navigation";

import { endSession } from "@/lib/session";

//sign out feature
export async function signOut() {
  await endSession();
  redirect("/login/employee");
}
