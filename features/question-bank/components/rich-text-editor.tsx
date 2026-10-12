"use client";

import { Mathematics } from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { siteCopy } from "@/lib/copy/id";

const copy = siteCopy.questionBank;

function parseContent(value: string): JSONContent {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      "type" in parsed &&
      parsed.type === "doc"
    ) {
      return parsed as JSONContent;
    }
  } catch {
    return {
      type: "doc",
      content: value
        ? [{ type: "paragraph", content: [{ type: "text", text: value }] }]
        : [{ type: "paragraph" }],
    };
  }

  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function RichTextEditor({
  id,
  label,
  initialValue,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  initialValue: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Mathematics.configure({
        katexOptions: { throwOnError: false, trust: false },
      }),
      Placeholder.configure({ placeholder: copy.editorPlaceholder }),
    ],
    content: parseContent(initialValue),
    editorProps: {
      attributes: {
        "aria-label": label,
        class: "focus:outline-none",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(JSON.stringify(updatedEditor.getJSON()));
    },
  });

  function insertMath(block: boolean) {
    if (!editor) return;

    const latex = window.prompt(
      block ? copy.insertBlockMath : copy.insertInlineMath,
      "x^2 + y^2 = z^2",
    );
    if (latex === null || !latex.trim()) return;

    if (block) {
      editor.chain().focus().insertBlockMath({ latex }).run();
    } else {
      editor.chain().focus().insertInlineMath({ latex }).run();
    }
  }

  const toolbarButton =
    "min-h-9 border border-border px-2 text-xs font-medium hover:bg-muted disabled:opacity-50";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="question-editor overflow-hidden border-2 border-border bg-background">
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted p-2">
          <button
            aria-label={copy.bold}
            className={toolbarButton}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            aria-label={copy.italic}
            className={toolbarButton}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            type="button"
          >
            <em>I</em>
          </button>
          <button
            className={toolbarButton}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            type="button"
          >
            {copy.bulletList}
          </button>
          <button
            className={toolbarButton}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            type="button"
          >
            {copy.orderedList}
          </button>
          <button
            className={toolbarButton}
            disabled={!editor}
            onClick={() => insertMath(false)}
            type="button"
          >
            {copy.insertInlineMath}
          </button>
          <button
            className={toolbarButton}
            disabled={!editor}
            onClick={() => insertMath(true)}
            type="button"
          >
            {copy.insertBlockMath}
          </button>
        </div>
        <EditorContent
          className={compact ? "[&_.tiptap]:min-h-20" : ""}
          editor={editor}
          id={id}
        />
      </div>
      {!compact && (
        <p className="text-xs leading-5 text-muted-foreground">
          {copy.editorHint}
        </p>
      )}
    </fieldset>
  );
}
