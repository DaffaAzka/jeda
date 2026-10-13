"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/features/question-bank/types";
import { siteCopy } from "@/lib/copy/id";

const copy = siteCopy.questionBank;

/** Inline delete button for table rows and list items. It calls the server
 *  action directly, so no <form> element breaks the table layout, and shows
 *  the action's own message when the delete is refused. */
export function DeleteButton({
  action,
  id,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    if (!window.confirm(copy.confirmDelete)) return;

    const formData = new FormData();
    formData.set("id", id);
    setError("");
    startTransition(async () => {
      const result = await action({ error: "", success: "" }, formData);
      setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="pixel-press inline-flex min-h-9 items-center border-2 border-border bg-moodi-peach px-3 text-xs font-semibold text-ink disabled:opacity-50"
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? copy.deleting : copy.delete}
      </button>
      {error && (
        <p
          className="max-w-56 border-2 border-border bg-moodi-peach px-2 py-1 text-right text-xs text-ink"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
