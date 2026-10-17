import { z } from "zod";

export const ALLOWED_LEXICAL_NODES = new Set([
  "root",
  "paragraph",
  "text",
  "heading",
  "quote",
  "list",
  "listitem",
  "code",
  "code-highlight",
  "table",
  "tablerow",
  "tablecell",
  "horizontalrule",
  "link",
  "autolink",
  "equation",
  "collapsible-container",
  "collapsible-title",
  "collapsible-content",
]);

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];

export interface LexicalNodeJson {
  type: string;
  version?: number;
  text?: string;
  format?: number | string;
  style?: string;
  tag?: string;
  url?: string;
  equation?: string;
  inline?: boolean;
  open?: boolean;
  children?: LexicalNodeJson[];
  [key: string]: unknown;
}

export interface SerializedEditorStateJson {
  root: LexicalNodeJson;
}

function isValidUrl(urlStr: string): boolean {
  try {
    const trimmed = urlStr.trim();
    if (trimmed.startsWith("mailto:")) {
      return true;
    }
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateNode(node: unknown, path: string): void {
  if (!node || typeof node !== "object") {
    throw new Error(`Invalid node at ${path}: node must be an object`);
  }

  const typedNode = node as Record<string, unknown>;
  const type = typedNode.type;

  if (typeof type !== "string") {
    throw new Error(`Invalid node at ${path}: missing or non-string 'type'`);
  }

  if (!ALLOWED_LEXICAL_NODES.has(type)) {
    throw new Error(`Forbidden node type '${type}' at ${path}`);
  }

  if (type === "link" || type === "autolink") {
    const url = typedNode.url;
    if (typeof url !== "string" || !isValidUrl(url)) {
      throw new Error(`Invalid or disallowed link protocol in '${url}' at ${path}`);
    }
  }

  if (Array.isArray(typedNode.children)) {
    typedNode.children.forEach((child, idx) => {
      validateNode(child, `${path}.children[${idx}]`);
    });
  }
}

export function validateLexicalState(data: unknown): SerializedEditorStateJson {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Lexical state: expected an object");
  }

  const obj = data as Record<string, unknown>;
  if (!obj.root || typeof obj.root !== "object") {
    throw new Error("Invalid Lexical state: missing 'root' object");
  }

  const root = obj.root as Record<string, unknown>;
  if (root.type !== "root") {
    throw new Error(`Invalid root node type: expected 'root', got '${root.type}'`);
  }

  validateNode(root, "root");

  return data as SerializedEditorStateJson;
}

export function isValidLexicalState(data: unknown): boolean {
  try {
    validateLexicalState(data);
    return true;
  } catch {
    return false;
  }
}

export const lexicalJsonSchema = z.custom<SerializedEditorStateJson>(
  (val) => isValidLexicalState(val),
  { message: "Invalid Lexical editor state or contains disallowed nodes/links" },
);
