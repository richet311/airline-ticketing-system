"use server";

import { endSession } from "@/lib/session";

//sign out feature
export async function signOut() {
  await endSession();
}
