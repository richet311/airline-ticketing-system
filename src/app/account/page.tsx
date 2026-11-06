import { redirect } from "next/navigation";

// TODO: account page. Until it exists, send customers to their trips instead of a blank page.
export default function AccountPage() {
  redirect("/my-trips");
}
