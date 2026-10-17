import type { ReactNode } from "react";
import katex from "katex";
import type { LexicalNodeJson, SerializedEditorStateJson } from "@/lib/editor/validate-lexical";
import { ALLOWED_LEXICAL_NODES } from "@/lib/editor/validate-lexical";

interface RichTextViewProps {
  content: unknown;
  className?: string;
  isLesson?: boolean;
}

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];

function sanitizeUrl(urlStr: string): string | null {
  try {
    const trimmed = urlStr.trim();
    if (trimmed.startsWith("mailto:")) {
      return trimmed;
    }
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return latex;
  }
}

function renderTextNode(node: LexicalNodeJson, key: string): ReactNode {
  const text = node.text ?? "";
  if (!text) return null;

  const format = typeof node.format === "number" ? node.format : 0;
  // Lexical format bitmask:
  // 1: Bold, 2: Italic, 4: Strikethrough, 8: Underline, 16: Code, 32: Subscript, 64: Superscript, 128: Highlight
  let result: ReactNode = text;

  if (format & 16) {
    result = <code key={`${key}-code`} className="bg-muted px-1.5 py-0.5 font-mono text-xs border border-border">{result}</code>;
  }
  if (format & 1) {
    result = <strong key={`${key}-b`}>{result}</strong>;
  }
  if (format & 2) {
    result = <em key={`${key}-i`}>{result}</em>;
  }
  if (format & 4) {
    result = <del key={`${key}-s`}>{result}</del>;
  }
  if (format & 8) {
    result = <u key={`${key}-u`}>{result}</u>;
  }
  if (format & 32) {
    result = <sub key={`${key}-sub`}>{result}</sub>;
  }
  if (format & 64) {
    result = <sup key={`${key}-sup`}>{result}</sup>;
  }
  if (format & 128) {
    result = <mark key={`${key}-mark`} className="bg-moodi-butter/60 px-0.5">{result}</mark>;
  }

  return <span key={key}>{result}</span>;
}

function renderLexicalNode(node: LexicalNodeJson, key: string, isLesson: boolean): ReactNode {
  if (!node || typeof node !== "object") return null;

  const type = node.type;
  if (!type || !ALLOWED_LEXICAL_NODES.has(type)) {
    return null;
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child, idx) => renderLexicalNode(child, `${key}-${idx}`, isLesson))
    : null;

  switch (type) {
    case "root":
      return <div key={key}>{children}</div>;

    case "paragraph": {
      const alignClass =
        node.format === "center"
          ? "text-center"
          : node.format === "right"
          ? "text-right"
          : node.format === "justify"
          ? "text-justify"
          : "";
      return (
        <p key={key} className={`my-2 leading-relaxed ${alignClass}`}>
          {children && children.length > 0 ? children : <br />}
        </p>
      );
    }

    case "heading": {
      const tag = node.tag ?? "h2";
      const headingFont = isLesson ? "font-pixelify" : "font-pixelify";
      if (tag === "h1") {
        return (
          <h1 key={key} className={`${headingFont} text-2xl sm:text-3xl font-bold mt-6 mb-3 tracking-tight text-foreground`}>
            {children}
          </h1>
        );
      }
      if (tag === "h2") {
        return (
          <h2 key={key} className={`${headingFont} text-xl sm:text-2xl font-bold mt-5 mb-2.5 tracking-tight text-foreground`}>
            {children}
          </h2>
        );
      }
      return (
        <h3 key={key} className={`${headingFont} text-lg sm:text-xl font-bold mt-4 mb-2 tracking-tight text-foreground`}>
          {children}
        </h3>
      );
    }

    case "quote":
      return (
        <blockquote
          key={key}
          className="my-3 border-l-4 border-border bg-muted/40 py-2 px-4 italic text-muted-foreground"
        >
          {children}
        </blockquote>
      );

    case "list": {
      const listType = (node as { listType?: string }).listType;
      if (listType === "number") {
        return (
          <ol key={key} className="my-2 list-decimal pl-6 space-y-1">
            {children}
          </ol>
        );
      }
      if (listType === "check") {
        return (
          <ul key={key} className="my-2 space-y-1 list-none pl-1">
            {children}
          </ul>
        );
      }
      return (
        <ul key={key} className="my-2 list-disc pl-6 space-y-1">
          {children}
        </ul>
      );
    }

    case "listitem": {
      const checked = (node as { checked?: boolean }).checked;
      if (typeof checked === "boolean") {
        return (
          <li key={key} className="flex items-start gap-2">
            <span
              className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center border-2 border-border text-[10px] font-bold ${
                checked ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {checked ? "✓" : ""}
            </span>
            <span>{children}</span>
          </li>
        );
      }
      return <li key={key}>{children}</li>;
    }

    case "code":
      return (
        <pre
          key={key}
          className="my-3 overflow-x-auto border-2 border-border bg-muted p-3 font-mono text-xs sm:text-sm"
        >
          <code>{children}</code>
        </pre>
      );

    case "code-highlight":
    case "text":
      return renderTextNode(node, key);

    case "table":
      return (
        <div key={key} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border-2 border-border text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      );

    case "tablerow":
      return (
        <tr key={key} className="border-b border-border">
          {children}
        </tr>
      );

    case "tablecell": {
      const header = (node as { header?: boolean }).header;
      if (header) {
        return (
          <th key={key} className="border border-border bg-muted p-2 text-left font-bold">
            {children}
          </th>
        );
      }
      return (
        <td key={key} className="border border-border p-2">
          {children}
        </td>
      );
    }

    case "horizontalrule":
      return <hr key={key} className="my-4 border-t-2 border-border" />;

    case "link":
    case "autolink": {
      const rawUrl = typeof node.url === "string" ? node.url : "";
      const safeUrl = sanitizeUrl(rawUrl);
      if (!safeUrl) {
        return <span key={key}>{children}</span>;
      }
      return (
        <a
          key={key}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:opacity-80 transition-opacity"
        >
          {children}
        </a>
      );
    }

    case "equation": {
      const equation = typeof node.equation === "string" ? node.equation : "";
      const isInline = node.inline !== false;
      const html = renderMath(equation, !isInline);
      if (isInline) {
        return (
          <span
            key={key}
            className="inline-math px-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      return (
        <div
          key={key}
          className="block-math my-3 overflow-x-auto py-1 text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    case "collapsible-container":
      return (
        <details
          key={key}
          className="my-3 border-2 border-border bg-card p-3 shadow-[2px_2px_0_0_var(--border)]"
          open={node.open}
        >
          {children}
        </details>
      );

    case "collapsible-title":
      return (
        <summary key={key} className="cursor-pointer font-bold select-none hover:underline">
          {children}
        </summary>
      );

    case "collapsible-content":
      return (
        <div key={key} className="mt-2 text-sm">
          {children}
        </div>
      );

    default:
      return null;
  }
}

// Fallback legacy renderer for backward compatibility with existing Tiptap JSON or plain strings
function renderLegacyContent(content: string, keyPrefix: string): ReactNode {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return (
        <div key={keyPrefix} className="legacy-tiptap space-y-2">
          {parsed.content.map((item: any, idx: number) => {
            if (item.type === "paragraph") {
              return (
                <p key={`${keyPrefix}-${idx}`} className="my-1.5 leading-relaxed">
                  {item.content?.map((c: any, cIdx: number) => {
                    if (c.type === "text") {
                      let el: ReactNode = c.text ?? "";
                      if (c.marks) {
                        for (const mark of c.marks) {
                          if (mark.type === "bold") el = <strong>{el}</strong>;
                          if (mark.type === "italic") el = <em>{el}</em>;
                        }
                      }
                      return <span key={`${keyPrefix}-${idx}-${cIdx}`}>{el}</span>;
                    }
                    if (c.type === "inlineMath" && c.attrs?.latex) {
                      const mathHtml = renderMath(c.attrs.latex, false);
                      return (
                        <span
                          key={`${keyPrefix}-${idx}-${cIdx}`}
                          className="inline-math px-0.5"
                          dangerouslySetInnerHTML={{ __html: mathHtml }}
                        />
                      );
                    }
                    return null;
                  })}
                </p>
              );
            }
            if (item.type === "blockMath" && item.attrs?.latex) {
              const mathHtml = renderMath(item.attrs.latex, true);
              return (
                <div
                  key={`${keyPrefix}-${idx}`}
                  className="block-math my-3 overflow-x-auto py-1 text-center"
                  dangerouslySetInnerHTML={{ __html: mathHtml }}
                />
              );
            }
            return null;
          })}
        </div>
      );
    }
  } catch {
    // Plain text
  }

  return <div key={keyPrefix} className="whitespace-pre-wrap">{content}</div>;
}

export function RichTextView({ content, className = "", isLesson = false }: RichTextViewProps) {
  if (!content) return null;

  let state: SerializedEditorStateJson | null = null;

  if (typeof content === "object" && content !== null && "root" in content) {
    state = content as SerializedEditorStateJson;
  } else if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && "root" in parsed) {
        state = parsed as SerializedEditorStateJson;
      } else {
        return (
          <div className={`rich-text-view ${className}`}>
            {renderLegacyContent(content, "legacy")}
          </div>
        );
      }
    } catch {
      return (
        <div className={`rich-text-view ${className}`}>
          {renderLegacyContent(content, "legacy")}
        </div>
      );
    }
  }

  if (!state || !state.root) return null;

  return (
    <div className={`rich-text-view text-foreground ${className}`}>
      {renderLexicalNode(state.root, "root", isLesson)}
    </div>
  );
}
