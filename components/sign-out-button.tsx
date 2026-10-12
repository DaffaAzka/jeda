"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { siteCopy } from "@/lib/copy/id";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const copy = siteCopy.dashboard;

  async function signOut() {
    setError("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError(result.error.message || copy.signOutError);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.signOutError,
      );
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="min-h-11 border-2 border-border px-4 text-sm font-semibold hover:bg-muted"
        onClick={signOut}
        type="button"
      >
        {copy.signOut}
      </button>
      {error && (
        <p className="max-w-xs text-right text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
