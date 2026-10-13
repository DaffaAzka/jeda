"use client";

import {
  useActionState,
  useEffect,
  type ReactNode,
  type FormHTMLAttributes,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/features/question-bank/types";
import { siteCopy } from "@/lib/copy/id";

function SubmitButton({
  label,
  destructive = false,
}: {
  label: string;
  destructive?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`min-h-11 border-2 border-border px-4 text-sm font-semibold text-ink disabled:opacity-60 ${
        destructive ? "bg-moodi-peach" : "bg-moodi-sky"
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? siteCopy.auth.submitting : label}
    </button>
  );
}

export function MutationForm({
  action,
  buttonLabel,
  children,
  className = "space-y-4",
  destructive = false,
  onSuccess,
  ...formProps
}: {
  action: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  buttonLabel: string;
  children: ReactNode;
  className?: string;
  destructive?: boolean;
  onSuccess?: () => void;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "className">) {
  const [state, formAction] = useActionState(action, {
    error: "",
    success: "",
  });

  // Notify parent (e.g. a modal) when the action succeeds.
  useEffect(() => {
    if (state.success) onSuccess?.();
  // Only re-run when the success value changes, not when onSuccess ref changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function confirmDestructiveAction(event: FormEvent<HTMLFormElement>) {
    if (destructive && !window.confirm(siteCopy.questionBank.confirmDelete)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={confirmDestructiveAction}
      {...formProps}
    >
      {children}
      <SubmitButton destructive={destructive} label={buttonLabel} />
      {state.error && (
        <p
          className="border-2 border-border bg-moodi-peach p-3 text-sm text-ink"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="border-2 border-border bg-moodi-sky p-3 text-sm text-ink"
          role="status"
        >
          {state.success}
        </p>
      )}
    </form>
  );
}
