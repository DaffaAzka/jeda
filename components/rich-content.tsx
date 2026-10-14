import type { ReactNode } from "react";
import katex from "katex";

interface RichTextNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: Array<{ type: string }>;
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return latex;
  }
}

function renderNode(node: RichTextNode, key: string | number): ReactNode {
  if (!node) return null;

  if (node.type === "text") {
    let element: ReactNode = node.text ?? "";
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") {
          element = <strong key={key}>{element}</strong>;
        } else if (mark.type === "italic") {
          element = <em key={key}>{element}</em>;
        }
      }
    }
    return element;
  }

  if (node.type === "inlineMath" && typeof node.attrs?.latex === "string") {
    const html = renderMath(node.attrs.latex, false);
    return (
      <span
        className="inline-math px-0.5"
        dangerouslySetInnerHTML={{ __html: html }}
        key={key}
      />
    );
  }

  if (node.type === "blockMath" && typeof node.attrs?.latex === "string") {
    const html = renderMath(node.attrs.latex, true);
    return (
      <div
        className="block-math my-3 overflow-x-auto py-1 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
        key={key}
      />
    );
  }

  if (node.type === "paragraph") {
    return (
      <p className="my-1.5 leading-relaxed" key={key}>
        {node.content?.map((child, idx) => renderNode(child, `${key}-${idx}`))}
      </p>
    );
  }

  if (node.type === "bulletList") {
    return (
      <ul className="my-2 list-disc pl-5 space-y-1" key={key}>
        {node.content?.map((child, idx) => renderNode(child, `${key}-${idx}`))}
      </ul>
    );
  }

  if (node.type === "orderedList") {
    return (
      <ol className="my-2 list-decimal pl-5 space-y-1" key={key}>
        {node.content?.map((child, idx) => renderNode(child, `${key}-${idx}`))}
      </ol>
    );
  }

  if (node.type === "listItem") {
    return (
      <li key={key}>
        {node.content?.map((child, idx) => renderNode(child, `${key}-${idx}`))}
      </li>
    );
  }

  if (node.content) {
    return (
      <span key={key}>
        {node.content.map((child, idx) => renderNode(child, `${key}-${idx}`))}
      </span>
    );
  }

  return null;
}

function parseRichText(content: string): RichTextNode | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      "type" in parsed &&
      parsed.type === "doc"
    ) {
      return parsed as RichTextNode;
    }
  } catch {
    // If not valid JSON, returns null
  }
  return null;
}

export function RichContent({
  content,
  className = "",
}: {
  content: string | null | undefined;
  className?: string;
}) {
  if (!content) return null;

  const doc = parseRichText(content);
  if (doc) {
    return (
      <div className={`rich-text-content ${className}`}>
        {doc.content?.map((node, idx) => renderNode(node, idx))}
      </div>
    );
  }

  return <div className={`rich-text-content ${className}`}>{content}</div>;
}
