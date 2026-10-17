import { describe, it, expect } from "vitest";
import {
  validateLexicalState,
  isValidLexicalState,
  ALLOWED_LEXICAL_NODES,
} from "@/lib/editor/validate-lexical";
import {
  contentToLexicalJson,
  convertTiptapNodeToLexical,
} from "@/lib/editor/tiptap-to-lexical";
import { RichTextView } from "@/components/editor/rich-text-view";
import React from "react";
import katex from "katex";

describe("Lexical AST Validator", () => {
  it("accepts a valid Lexical document", () => {
    const validDoc = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "text",
                text: "Halo dunia",
                format: 1, // bold
                version: 1,
              },
            ],
          },
        ],
      },
    };

    expect(isValidLexicalState(validDoc)).toBe(true);
    const result = validateLexicalState(validDoc);
    expect(result.root.type).toBe("root");
  });

  it("rejects document with forbidden nodes (e.g. image, poll, ruby)", () => {
    const forbiddenDoc = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "image",
            src: "https://evil.com/leak.jpg",
            version: 1,
          },
        ],
      },
    };

    expect(isValidLexicalState(forbiddenDoc)).toBe(false);
    expect(() => validateLexicalState(forbiddenDoc)).toThrow(/Forbidden node type 'image'/);
  });

  it("accepts valid links (http, https, mailto)", () => {
    const docWithLinks = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "link",
                url: "https://moodi.id/belajar",
                version: 1,
                children: [{ type: "text", text: "Link", version: 1 }],
              },
              {
                type: "link",
                url: "mailto:halo@moodi.id",
                version: 1,
                children: [{ type: "text", text: "Email", version: 1 }],
              },
            ],
          },
        ],
      },
    };

    expect(isValidLexicalState(docWithLinks)).toBe(true);
  });

  it("rejects malicious or disallowed link protocols (javascript:, data:)", () => {
    const maliciousDoc = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "link",
                url: "javascript:alert('xss')",
                version: 1,
                children: [{ type: "text", text: "Click me", version: 1 }],
              },
            ],
          },
        ],
      },
    };

    expect(isValidLexicalState(maliciousDoc)).toBe(false);
    expect(() => validateLexicalState(maliciousDoc)).toThrow(/disallowed link protocol/);
  });
});

describe("Tiptap to Lexical Migration Converter", () => {
  it("converts legacy Tiptap document with math into valid Lexical JSON", () => {
    const legacyTiptap = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Jika diketahui ", marks: [{ type: "bold" }] },
            { type: "inlineMath", attrs: { latex: "x^2 + y^2 = 25" } },
            { type: "text", text: ", maka nilai x adalah..." },
          ],
        },
        {
          type: "blockMath",
          attrs: { latex: "\\int_{0}^{1} x dx" },
        },
      ],
    };

    const converted = contentToLexicalJson(JSON.stringify(legacyTiptap));
    expect(isValidLexicalState(converted)).toBe(true);

    const root = converted.root;
    expect(root.children).toHaveLength(2);

    // First paragraph
    const p = root.children![0];
    expect(p.type).toBe("paragraph");
    expect(p.children).toHaveLength(3);
    expect(p.children![0].type).toBe("text");
    expect(p.children![0].format).toBe(1); // bold
    expect(p.children![1].type).toBe("equation");
    expect(p.children![1].equation).toBe("x^2 + y^2 = 25");
    expect(p.children![1].inline).toBe(true);

    // Second child (block math)
    const blockMath = root.children![1];
    expect(blockMath.type).toBe("equation");
    expect(blockMath.equation).toBe("\\int_{0}^{1} x dx");
    expect(blockMath.inline).toBe(false);
  });

  it("converts plain text into valid Lexical JSON", () => {
    const plain = "Ini adalah soal biasa tanpa format.";
    const converted = contentToLexicalJson(plain);

    expect(isValidLexicalState(converted)).toBe(true);
    expect(converted.root.children![0].type).toBe("paragraph");
    expect(converted.root.children![0].children![0].text).toBe(plain);
  });
});

describe("RichTextView KaTeX Math Rendering", () => {
  it("renders KaTeX math server-side with trust off", () => {
    const renderedInline = katex.renderToString("a^2 + b^2 = c^2", {
      displayMode: false,
      throwOnError: false,
      trust: false,
    });

    expect(renderedInline).toContain("katex");
    expect(renderedInline).toContain("class=\"katex\"");

    const renderedBlock = katex.renderToString("\\frac{1}{2}", {
      displayMode: true,
      throwOnError: false,
      trust: false,
    });
    expect(renderedBlock).toContain("katex-display");
  });
});
