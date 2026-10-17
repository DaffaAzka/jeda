import { describe, expect, it } from "vitest";
import { blocksToLexicalState } from "@/features/ai/blocks-to-lexical";
import { validateLexicalState } from "@/lib/editor/validate-lexical";
import type { LessonBlock } from "@/features/ai/schema";

describe("AI: blocksToLexicalState mapper", () => {
  it("converts heading and paragraph with inline math into valid Lexical JSON", () => {
    const blocks: LessonBlock[] = [
      {
        type: "heading",
        level: 2,
        text: "Konsep Turunan Fungsi",
      },
      {
        type: "paragraph",
        text: "Definisi limit dari turunan adalah $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$ secara umum.",
      },
    ];

    const state = blocksToLexicalState(blocks);
    expect(state.root.type).toBe("root");
    const children = state.root.children ?? [];
    expect(children).toHaveLength(2);

    const headingNode = children[0];
    expect(headingNode?.type).toBe("heading");
    expect(headingNode?.tag).toBe("h2");

    const paragraphNode = children[1];
    expect(paragraphNode?.type).toBe("paragraph");
    expect(paragraphNode?.children?.some((c) => c.type === "equation" && c.inline === true)).toBe(
      true,
    );

    // Roundtrip validation
    expect(() => validateLexicalState(state)).not.toThrow();
  });

  it("converts bullet and numbered lists properly", () => {
    const blocks: LessonBlock[] = [
      {
        type: "bullet_list",
        items: ["Syarat pertama", "Syarat kedua"],
      },
      {
        type: "numbered_list",
        items: ["Langkah 1: Identifikasi", "Langkah 2: Hitung nilai"],
      },
    ];

    const state = blocksToLexicalState(blocks);
    const children = state.root.children ?? [];
    expect(children).toHaveLength(2);
    expect(children[0]?.type).toBe("list");
    expect(children[0]?.tag).toBe("ul");
    expect(children[1]?.type).toBe("list");
    expect(children[1]?.tag).toBe("ol");
    expect(() => validateLexicalState(state)).not.toThrow();
  });

  it("converts worked_example into open collapsible container", () => {
    const blocks: LessonBlock[] = [
      {
        type: "worked_example",
        problem: "Tentukan turunan dari f(x) = 3x^2 + 5x.",
        solution: "Gunakan aturan pangkat: f'(x) = 6x + 5.",
      },
    ];

    const state = blocksToLexicalState(blocks);
    const children = state.root.children ?? [];
    const container = children[0];
    expect(container?.type).toBe("collapsible-container");
    expect(container?.open).toBe(true);
    expect(() => validateLexicalState(state)).not.toThrow();
  });

  it("converts common_mistake into quote block", () => {
    const blocks: LessonBlock[] = [
      {
        type: "common_mistake",
        mistake: "Mengabaikan tanda minus saat memindahkan ruas.",
        correction: "Selalu cek kembali tanda sebelum menjumlahkan.",
      },
    ];

    const state = blocksToLexicalState(blocks);
    const children = state.root.children ?? [];
    const quoteNode = children[0];
    expect(quoteNode?.type).toBe("quote");
    expect(() => validateLexicalState(state)).not.toThrow();
  });

  it("converts display_equation into standalone equation block", () => {
    const blocks: LessonBlock[] = [
      {
        type: "display_equation",
        equation: "$$\\int_0^1 x^2 dx = \\frac{1}{3}$$",
      },
    ];

    const state = blocksToLexicalState(blocks);
    const children = state.root.children ?? [];
    const eqWrapper = children[0];
    const eqNode = eqWrapper?.children?.[0];
    expect(eqNode?.type).toBe("equation");
    expect(eqNode?.inline).toBe(false);
    expect(eqNode?.equation).toBe("\\int_0^1 x^2 dx = \\frac{1}{3}");
    expect(() => validateLexicalState(state)).not.toThrow();
  });
});
