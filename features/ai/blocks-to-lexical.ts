import type {
  LexicalNodeJson,
  SerializedEditorStateJson,
} from "@/lib/editor/validate-lexical";
import { validateLexicalState } from "@/lib/editor/validate-lexical";
import type { LessonBlock } from "./schema";

function parseTextWithMath(text: string): LexicalNodeJson[] {
  // Regex to split on $...$ inline math
  const parts = text.split(/(\$[^\$]+\$)/g);
  const children: LexicalNodeJson[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      children.push({
        type: "equation",
        equation: part.slice(1, -1).trim(),
        inline: true,
        version: 1,
      });
    } else {
      children.push({
        type: "text",
        text: part,
        format: 0,
        version: 1,
      });
    }
  }

  if (children.length === 0) {
    children.push({
      type: "text",
      text: "",
      format: 0,
      version: 1,
    });
  }

  return children;
}

export function blocksToLexicalState(blocks: LessonBlock[]): SerializedEditorStateJson {
  const rootChildren: LexicalNodeJson[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
        rootChildren.push({
          type: "heading",
          tag,
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [
            {
              type: "text",
              text: block.text,
              format: 0,
              version: 1,
            },
          ],
        });
        break;
      }

      case "paragraph": {
        rootChildren.push({
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: parseTextWithMath(block.text),
        });
        break;
      }

      case "bullet_list": {
        rootChildren.push({
          type: "list",
          listType: "bullet",
          tag: "ul",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: block.items.map((item, idx) => ({
            type: "listitem",
            value: idx + 1,
            format: "",
            indent: 0,
            version: 1,
            direction: "ltr",
            children: parseTextWithMath(item),
          })),
        });
        break;
      }

      case "numbered_list": {
        rootChildren.push({
          type: "list",
          listType: "number",
          tag: "ol",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: block.items.map((item, idx) => ({
            type: "listitem",
            value: idx + 1,
            format: "",
            indent: 0,
            version: 1,
            direction: "ltr",
            children: parseTextWithMath(item),
          })),
        });
        break;
      }

      case "worked_example": {
        rootChildren.push({
          type: "collapsible-container",
          open: true,
          version: 1,
          children: [
            {
              type: "collapsible-title",
              version: 1,
              children: [
                {
                  type: "text",
                  text: `💡 Contoh Soal: ${block.problem}`,
                  format: 1, // bold
                  version: 1,
                },
              ],
            },
            {
              type: "collapsible-content",
              version: 1,
              children: [
                {
                  type: "paragraph",
                  format: "",
                  indent: 0,
                  version: 1,
                  direction: "ltr",
                  children: [
                    {
                      type: "text",
                      text: "Langkah Pembahasan:\n",
                      format: 1,
                      version: 1,
                    },
                    ...parseTextWithMath(block.solution),
                  ],
                },
              ],
            },
          ],
        });
        break;
      }

      case "common_mistake": {
        rootChildren.push({
          type: "quote",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [
            {
              type: "paragraph",
              format: "",
              indent: 0,
              version: 1,
              direction: "ltr",
              children: [
                {
                  type: "text",
                  text: "⚠️ Miskonsepsi Umum: ",
                  format: 1, // bold
                  version: 1,
                },
                {
                  type: "text",
                  text: `${block.mistake} `,
                  format: 0,
                  version: 1,
                },
                {
                  type: "text",
                  text: "Solusi / Konsep Tepat: ",
                  format: 1, // bold
                  version: 1,
                },
                ...parseTextWithMath(block.correction),
              ],
            },
          ],
        });
        break;
      }

      case "hint": {
        rootChildren.push({
          type: "collapsible-container",
          open: false,
          version: 1,
          children: [
            {
              type: "collapsible-title",
              version: 1,
              children: [
                {
                  type: "text",
                  text: `🔍 Petunjuk Konsep: ${block.title}`,
                  format: 1,
                  version: 1,
                },
              ],
            },
            {
              type: "collapsible-content",
              version: 1,
              children: [
                {
                  type: "paragraph",
                  format: "",
                  indent: 0,
                  version: 1,
                  direction: "ltr",
                  children: parseTextWithMath(block.content),
                },
              ],
            },
          ],
        });
        break;
      }

      case "display_equation": {
        const cleanEq = block.equation.replace(/^\$\$|\$\$$/g, "").trim();
        rootChildren.push({
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [
            {
              type: "equation",
              equation: cleanEq,
              inline: false,
              version: 1,
            },
          ],
        });
        break;
      }
    }
  }

  const editorState: SerializedEditorStateJson = {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: rootChildren,
    },
  };

  // Ensure validity against node allowlist and schema
  return validateLexicalState(editorState);
}
