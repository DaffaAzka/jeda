import type { SerializedEditorStateJson, LexicalNodeJson } from "./validate-lexical";

export function convertTiptapNodeToLexical(node: any): LexicalNodeJson | null {
  if (!node || typeof node !== "object") return null;

  if (node.type === "text") {
    let format = 0;
    if (Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (mark.type === "bold") format |= 1;
        if (mark.type === "italic") format |= 2;
        if (mark.type === "strike") format |= 4;
        if (mark.type === "underline") format |= 8;
        if (mark.type === "code") format |= 16;
      }
    }
    return {
      detail: 0,
      format,
      mode: "normal",
      style: "",
      text: node.text ?? "",
      type: "text",
      version: 1,
    };
  }

  if (node.type === "inlineMath" && typeof node.attrs?.latex === "string") {
    return {
      type: "equation",
      version: 1,
      equation: node.attrs.latex,
      inline: true,
    };
  }

  if (node.type === "blockMath" && typeof node.attrs?.latex === "string") {
    return {
      type: "equation",
      version: 1,
      equation: node.attrs.latex,
      inline: false,
    };
  }

  if (node.type === "paragraph") {
    const children: LexicalNodeJson[] = [];
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const converted = convertTiptapNodeToLexical(child);
        if (converted) children.push(converted);
      }
    }
    return {
      children,
      direction: null,
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1,
    };
  }

  if (node.type === "bulletList") {
    const children: LexicalNodeJson[] = [];
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const converted = convertTiptapNodeToLexical(child);
        if (converted) children.push(converted);
      }
    }
    return {
      children,
      direction: null,
      format: "",
      indent: 0,
      listType: "bullet",
      start: 1,
      tag: "ul",
      type: "list",
      version: 1,
    };
  }

  if (node.type === "orderedList") {
    const children: LexicalNodeJson[] = [];
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const converted = convertTiptapNodeToLexical(child);
        if (converted) children.push(converted);
      }
    }
    return {
      children,
      direction: null,
      format: "",
      indent: 0,
      listType: "number",
      start: 1,
      tag: "ol",
      type: "list",
      version: 1,
    };
  }

  if (node.type === "listItem") {
    const children: LexicalNodeJson[] = [];
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const converted = convertTiptapNodeToLexical(child);
        if (converted) {
          if (converted.type === "paragraph" && converted.children) {
            children.push(...converted.children);
          } else {
            children.push(converted);
          }
        }
      }
    }
    return {
      children,
      direction: null,
      format: "",
      indent: 0,
      type: "listitem",
      value: 1,
      version: 1,
    };
  }

  if (node.type === "codeBlock") {
    const codeText = Array.isArray(node.content)
      ? node.content.map((c: any) => c.text ?? "").join("")
      : "";
    return {
      children: [
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: codeText,
          type: "text",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      language: null,
      type: "code",
      version: 1,
    };
  }

  return null;
}

export function contentToLexicalJson(content: unknown): SerializedEditorStateJson {
  if (content && typeof content === "object" && "root" in content) {
    const obj = content as SerializedEditorStateJson;
    if (obj.root && obj.root.type === "root") {
      return obj;
    }
  }

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          if ("root" in parsed && parsed.root?.type === "root") {
            return parsed as SerializedEditorStateJson;
          }
          if (parsed.type === "doc" && Array.isArray(parsed.content)) {
            const rootChildren: LexicalNodeJson[] = [];
            for (const child of parsed.content) {
              const converted = convertTiptapNodeToLexical(child);
              if (converted) rootChildren.push(converted);
            }
            if (rootChildren.length === 0) {
              rootChildren.push({
                children: [],
                direction: null,
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              });
            }
            return {
              root: {
                children: rootChildren,
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1,
              },
            };
          }
        }
      } catch {
        // Fall through to plain text parsing
      }
    }

    // Plain text or text with inline equations ($...$)
    return {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: trimmed,
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
    };
  }

  return {
    root: {
      children: [
        {
          children: [],
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
  };
}
