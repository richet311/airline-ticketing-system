"use server";

import { redirect } from "next/navigation";

import { endSession } from "@/lib/session";

// Sign out button in the employee portal header.
export async function signOut() {
  await endSession();
  redirect("/login/employee");
}
