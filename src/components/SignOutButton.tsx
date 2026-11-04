"use client";

import { useTransition } from "react";

export function SignOutButton({ action, to, className }: { action: () => Promise<void>; to: string; className: string }) {
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await action();
      window.location.assign(to);
    });
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} className={`${className} disabled:opacity-60`}>
      Sign out
    </button>
  );
}
