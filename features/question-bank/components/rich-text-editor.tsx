"use client";

import { RichTextEditor as BaseRichTextEditor } from "@/components/editor/rich-text-editor";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

export function RichTextEditor({
  id,
  label,
  initialValue,
  onChange,
  compact = false,
  variant,
}: {
  id: string;
  label: string;
  initialValue: string;
  onChange: (value: string) => void;
  compact?: boolean;
  variant?: "lesson" | "question" | "option";
}) {
  const resolvedVariant = variant ?? (compact ? "option" : "question");

  return (
    <BaseRichTextEditor
      id={id}
      label={label}
      value={initialValue}
      compact={compact}
      variant={resolvedVariant}
      onChange={(state: SerializedEditorStateJson) => {
        onChange(JSON.stringify(state));
      }}
    />
  );
}
