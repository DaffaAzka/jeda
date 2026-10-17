"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { LexicalComposer, type InitialConfigType } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { CodeNode, CodeHighlightNode, $createCodeNode } from "@lexical/code-core";
import { TableNode, TableRowNode, TableCellNode, INSERT_TABLE_COMMAND } from "@lexical/table";
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { $setBlocksType } from "@lexical/selection";
import {
  $insertNodeIntoLeaf,
  $insertNodeToNearestRoot,
  $wrapNodeInElement,
} from "@lexical/utils";
import { TRANSFORMERS } from "@lexical/markdown";

import { editorTheme } from "@/components/editor/theme";
import {
  EquationNode,
  $createEquationNode,
} from "@/components/editor/nodes/equation-node";
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  $createCollapsibleContainerNode,
  $createCollapsibleTitleNode,
  $createCollapsibleContentNode,
} from "@/components/editor/nodes/collapsible-node";
import { INSERT_EQUATION_COMMAND } from "@/components/editor/extensions/equation";
import { INSERT_COLLAPSIBLE_COMMAND } from "@/components/editor/extensions/collapsible";
import { ComponentPicker } from "@/components/editor/plugins/component-picker/component-picker-plugin";
import { ParagraphPickerPlugin } from "@/components/editor/plugins/component-picker/paragraph-picker-plugin";
import { HeadingPickerPlugin } from "@/components/editor/plugins/component-picker/heading-picker-plugin";
import { BulletedListPickerPlugin } from "@/components/editor/plugins/component-picker/bulleted-list-picker-plugin";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/component-picker/numbered-list-picker-plugin";
import { CheckListPickerPlugin } from "@/components/editor/plugins/component-picker/check-list-picker-plugin";
import { QuotePickerPlugin } from "@/components/editor/plugins/component-picker/quote-picker-plugin";
import { CodePickerPlugin } from "@/components/editor/plugins/component-picker/code-picker-plugin";
import { TablePickerPlugin } from "@/components/editor/plugins/component-picker/table-picker-plugin";
import { DividerPickerPlugin } from "@/components/editor/plugins/component-picker/divider-picker-plugin";
import { CollapsiblePickerPlugin } from "@/components/editor/plugins/component-picker/collapsible-picker-plugin";
import { LanguageProvider } from "@/components/editor/plugins/i18n-plugin";
import { siteCopy } from "@/lib/copy/id";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

export type RichTextEditorVariant = "lesson" | "question" | "option";

export interface RichTextEditorProps {
  id?: string;
  label?: string;
  value?: unknown;
  initialValue?: unknown;
  onChange?: (value: SerializedEditorStateJson) => void;
  variant?: RichTextEditorVariant;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  name?: string;
  required?: boolean;
}

const copy = siteCopy.editor;

function createLexicalFromPlainText(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

function convertTiptapToLexical(doc: any): string {
  const children: any[] = [];
  if (Array.isArray(doc?.content)) {
    for (const block of doc.content) {
      if (block.type === "paragraph") {
        const pChildren: any[] = [];
        if (Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text") {
              let format = 0;
              if (item.marks) {
                for (const m of item.marks) {
                  if (m.type === "bold") format |= 1;
                  if (m.type === "italic") format |= 2;
                  if (m.type === "strike") format |= 4;
                  if (m.type === "underline") format |= 8;
                  if (m.type === "code") format |= 16;
                }
              }
              pChildren.push({
                detail: 0,
                format,
                mode: "normal",
                style: "",
                text: item.text ?? "",
                type: "text",
                version: 1,
              });
            } else if (item.type === "inlineMath" && item.attrs?.latex) {
              pChildren.push({
                type: "equation",
                version: 1,
                equation: item.attrs.latex,
                inline: true,
              });
            }
          }
        }
        children.push({
          children: pChildren,
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        });
      } else if (block.type === "blockMath" && block.attrs?.latex) {
        children.push({
          type: "equation",
          version: 1,
          equation: block.attrs.latex,
          inline: false,
        });
      }
    }
  }

  if (children.length === 0) {
    children.push({
      children: [],
      direction: null,
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1,
    });
  }

  return JSON.stringify({
    root: {
      children,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

function parseInitialEditorState(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "object" && val !== null && "root" in val) {
    return JSON.stringify(val);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && "root" in parsed) {
        return trimmed;
      }
      if (parsed && typeof parsed === "object" && parsed.type === "doc") {
        return convertTiptapToLexical(parsed);
      }
    } catch {
      return createLexicalFromPlainText(trimmed);
    }
  }
  return null;
}

function CustomExtensionsPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const unregisterEq = editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      ({ equation, inline }) => {
        const equationNode = $createEquationNode(equation, inline);
        if (inline) {
          $insertNodeIntoLeaf(equationNode);
          if ($isRootOrShadowRoot(equationNode.getParent())) {
            $wrapNodeInElement(equationNode, $createParagraphNode).selectEnd();
          }
        } else {
          $insertNodeToNearestRoot(equationNode);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterCollapsible = editor.registerCommand(
      INSERT_COLLAPSIBLE_COMMAND,
      () => {
        const title = $createCollapsibleTitleNode();
        const paragraph = $createParagraphNode();
        $insertNodeToNearestRoot(
          $createCollapsibleContainerNode(true).append(
            title.append(paragraph),
            $createCollapsibleContentNode().append($createParagraphNode()),
          ),
        );
        paragraph.select();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterEq();
      unregisterCollapsible();
    };
  }, [editor]);
  return null;
}

interface EditorToolbarProps {
  variant: RichTextEditorVariant;
}

function EditorToolbar({ variant }: EditorToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const handleBlockFormat = useCallback(
    (type: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (type === "paragraph") {
            $setBlocksType(selection, () => $createParagraphNode());
          } else if (type === "h1" || type === "h2" || type === "h3") {
            $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType));
          } else if (type === "quote") {
            $setBlocksType(selection, () => $createQuoteNode());
          } else if (type === "code") {
            $setBlocksType(selection, () => $createCodeNode());
          }
        }
      });
    },
    [editor],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt(copy.insertLink, "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
    } else {
      alert("Hanya protokol http://, https://, atau mailto: yang diperbolehkan.");
    }
  }, [editor]);

  const handleInsertEquation = useCallback(() => {
    const eq = window.prompt(copy.equationPlaceholder, "x^2 + y^2 = r^2");
    if (eq === null || !eq.trim()) return;
    const inline = window.confirm("Rumus sebaris (inline)? Klik Cancel/Batal untuk rumus display/blok.");
    editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
      equation: eq.trim(),
      inline,
    });
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: "3",
      rows: "3",
      includeHeaders: { columns: true, rows: false },
    });
  }, [editor]);

  const handleInsertHorizontalRule = useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  }, [editor]);

  const handleInsertCollapsible = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
  }, [editor]);

  const btnClass =
    "min-h-8 min-w-8 border border-border bg-card px-2 py-1 text-xs font-semibold hover:bg-muted active:translate-y-0.5 disabled:opacity-40 rounded-none shrink-0";

  return (
    <div
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex w-full items-center gap-1 overflow-x-auto border-b-2 border-border bg-muted p-1.5 scrollbar-thin text-foreground"
    >
      {/* Undo & Redo */}
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title={copy.undo}
        aria-label={copy.undo}
      >
        ↺
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title={copy.redo}
        aria-label={copy.redo}
      >
        ↻
      </button>

      <span className="h-5 w-px bg-border mx-1 shrink-0" />

      {/* Block format for lesson / question */}
      {variant !== "option" && (
        <>
          <select
            className="min-h-8 border border-border bg-card px-2 py-1 text-xs font-semibold rounded-none shrink-0"
            onChange={(e) => {
              if (e.target.value === "bullet") {
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
              } else if (e.target.value === "number") {
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
              } else if (e.target.value === "check") {
                editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
              } else {
                handleBlockFormat(e.target.value);
              }
              e.target.value = "default";
            }}
            defaultValue="default"
            aria-label="Format blok"
          >
            <option value="default" disabled>
              Format...
            </option>
            <option value="paragraph">{copy.paragraph}</option>
            {variant === "lesson" && <option value="h1">{copy.heading1}</option>}
            <option value="h2">{copy.heading2}</option>
            <option value="h3">{copy.heading3}</option>
            <option value="quote">{copy.quote}</option>
            <option value="bullet">{copy.bulletList}</option>
            <option value="number">{copy.numberedList}</option>
            {variant === "lesson" && <option value="check">{copy.checkList}</option>}
            <option value="code">{copy.codeBlock}</option>
          </select>

          <span className="h-5 w-px bg-border mx-1 shrink-0" />
        </>
      )}

      {/* Inline Formatting */}
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title={copy.bold}
        aria-label={copy.bold}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title={copy.italic}
        aria-label={copy.italic}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title={copy.underline}
        aria-label={copy.underline}
      >
        <u>U</u>
      </button>
      {variant !== "option" && (
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
          title={copy.strikethrough}
          aria-label={copy.strikethrough}
        >
          <del>S</del>
        </button>
      )}
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        title={copy.code}
        aria-label={copy.code}
      >
        <code>&lt;&gt;</code>
      </button>

      <span className="h-5 w-px bg-border mx-1 shrink-0" />

      {/* Inserts */}
      {variant !== "option" && (
        <button
          type="button"
          className={btnClass}
          onClick={handleLink}
          title={copy.link}
          aria-label={copy.link}
        >
          🔗 {copy.link}
        </button>
      )}

      <button
        type="button"
        className={btnClass}
        onClick={handleInsertEquation}
        title={copy.equation}
        aria-label={copy.equation}
      >
        ∑ {copy.equation}
      </button>

      {variant !== "option" && (
        <>
          <button
            type="button"
            className={btnClass}
            onClick={handleInsertTable}
            title={copy.table}
            aria-label={copy.table}
          >
            ▦ {copy.table}
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={handleInsertHorizontalRule}
            title={copy.divider}
            aria-label={copy.divider}
          >
            ― {copy.divider}
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={handleInsertCollapsible}
            title={copy.collapsible}
            aria-label={copy.collapsible}
          >
            ▼ {copy.collapsible}
          </button>
        </>
      )}
    </div>
  );
}

export function RichTextEditor({
  id,
  label,
  value,
  initialValue,
  onChange,
  variant = "lesson",
  placeholder,
  className = "",
  compact = false,
  name,
  required = false,
}: RichTextEditorProps) {
  const content = value ?? initialValue;
  const initialEditorState = useMemo(() => parseInitialEditorState(content), [content]);
  const [serializedState, setSerializedState] = useState<SerializedEditorStateJson | null>(() => {
    if (initialEditorState) {
      try {
        return JSON.parse(initialEditorState);
      } catch {
        return null;
      }
    }
    return null;
  });

  const nodes = useMemo(() => {
    if (variant === "option") {
      return [EquationNode];
    }
    return [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      LinkNode,
      AutoLinkNode,
      HorizontalRuleNode,
      EquationNode,
      CollapsibleContainerNode,
      CollapsibleTitleNode,
      CollapsibleContentNode,
    ];
  }, [variant]);

  const initialConfig = useMemo<InitialConfigType>(() => {
    return {
      namespace: "MoodiEditor",
      theme: editorTheme,
      nodes,
      editorState: initialEditorState ?? undefined,
      onError(error: Error) {
        console.error("Lexical error:", error);
      },
    };
  }, [nodes, initialEditorState]);

  const minHeightClass =
    variant === "option"
      ? "min-h-[70px]"
      : compact
      ? "min-h-[120px]"
      : variant === "question"
      ? "min-h-[160px]"
      : "min-h-[300px]";

  const defaultPlaceholder =
    variant === "lesson" ? copy.placeholder : variant === "question" ? "Tulis teks soal..." : "Pilihan jawaban...";

  const editorContent = (
    <LanguageProvider defaultLanguage="id">
      <div
        className={`rich-text-editor relative w-full overflow-hidden border-2 border-border bg-background shadow-[2px_2px_0_0_var(--border)] ${className}`}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <EditorToolbar variant={variant} />

          <div className="relative w-full">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  id={id}
                  className={`relative w-full p-3 font-sans text-sm text-foreground outline-none ${minHeightClass}`}
                />
              }
              placeholder={
                <div className="pointer-events-none absolute start-3 top-3 select-none font-sans text-sm text-muted-foreground">
                  {placeholder ?? defaultPlaceholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />

            <HistoryPlugin />
            <CustomExtensionsPlugin />

            {variant !== "option" && (
              <>
                <ListPlugin />
                {variant === "lesson" && <CheckListPlugin />}
                <TablePlugin />
                <LinkPlugin />
                <HorizontalRulePlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              </>
            )}

            {variant === "lesson" && (
              <ComponentPicker>
                <ParagraphPickerPlugin />
                <HeadingPickerPlugin />
                <BulletedListPickerPlugin />
                <NumberedListPickerPlugin />
                <CheckListPickerPlugin />
                <QuotePickerPlugin />
                <CodePickerPlugin />
                <TablePickerPlugin />
                <DividerPickerPlugin />
                <CollapsiblePickerPlugin />
              </ComponentPicker>
            )}

            <OnChangePlugin
              onChange={(editorState) => {
                editorState.read(() => {
                  const json = editorState.toJSON() as SerializedEditorStateJson;
                  setSerializedState(json);
                  onChange?.(json);
                });
              }}
            />
          </div>
        </LexicalComposer>

        {name && (
          <input
            type="hidden"
            name={name}
            value={serializedState ? JSON.stringify(serializedState) : ""}
            required={required}
          />
        )}
      </div>
    </LanguageProvider>
  );

  if (label) {
    return (
      <fieldset className="space-y-1.5 w-full">
        <legend className="text-sm font-semibold text-foreground">{label}</legend>
        {editorContent}
      </fieldset>
    );
  }

  return editorContent;
}
