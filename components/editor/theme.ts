import type { EditorThemeClasses } from "lexical";

import "./theme.css";

export const editorTheme: EditorThemeClasses = {
  root: "relative outline-none font-sans",
  autocomplete: "text-muted-foreground select-none",
  characterLimit: "inline bg-destructive/10 text-destructive",
  ltr: "text-left",
  rtl: "text-right",
  paragraph: "relative m-0 mb-2 last:mb-0 leading-relaxed",
  heading: {
    h1: "relative mt-6 mb-4 text-3xl font-bold tracking-tight text-balance first:mt-0 last:mb-0",
    h2: "relative mt-5 mb-3 border-b-2 border-border pb-2 text-2xl font-bold tracking-tight first:mt-0 last:mb-0",
    h3: "relative mt-4 mb-2 text-xl font-bold tracking-tight first:mt-0 last:mb-0",
    h4: "relative mt-4 mb-2 text-lg font-bold tracking-tight first:mt-0 last:mb-0",
    h5: "relative mt-3 mb-2 text-base font-bold tracking-tight first:mt-0 last:mb-0",
    h6: "relative mt-3 mb-2 text-sm font-bold tracking-tight first:mt-0 last:mb-0",
  },
  quote:
    "relative my-4 border-s-4 border-border ps-4 py-1 text-muted-foreground italic first:mt-0 last:mb-0 bg-muted/30",
  list: {
    checklist: "!ps-1",
    listitem: "relative",
    listitemChecked:
      "relative list-none ps-6 text-muted-foreground line-through outline-none before:absolute before:start-0 before:top-1 before:size-4 before:cursor-pointer before:border-2 before:border-primary before:bg-primary after:absolute after:start-[5px] after:top-[6px] after:h-[9px] after:w-[5px] after:rotate-45 after:cursor-pointer after:border-r-2 after:border-b-2 after:border-primary-foreground focus:before:ring-2 focus:before:ring-ring/50",
    listitemUnchecked:
      "relative list-none ps-6 outline-none before:absolute before:start-0 before:top-1 before:size-4 before:cursor-pointer before:border-2 before:border-input focus:before:ring-2 focus:before:ring-ring/50",
    nested: {
      listitem: "list-none before:hidden after:hidden",
    },
    ol: "m-0 mb-2 ps-6 last:mb-0 space-y-1 list-decimal",
    olDepth: [
      "list-decimal",
      "list-[upper-alpha]",
      "list-[lower-alpha]",
      "list-[upper-roman]",
      "list-[lower-roman]",
    ],
    ul: "m-0 mb-2 ps-6 last:mb-0 space-y-1 list-disc",
    ulDepth: ["list-disc", "list-[circle]", "list-[square]"],
  },
  indent: "editor-indent",
  link: "cursor-pointer text-primary underline underline-offset-2 hover:opacity-80 transition-opacity",
  hashtag: "bg-primary/10 px-0.5 text-primary",
  mark: "editor-mark",
  markOverlap: "editor-mark-overlap",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "[text-decoration-line:underline_line-through]",
    code: "bg-muted px-1.5 py-0.5 font-mono text-xs border border-border",
    subscript: "align-sub text-xs",
    superscript: "align-super text-xs",
    highlight: "bg-moodi-butter/60 px-0.5",
    lowercase: "lowercase",
    uppercase: "uppercase",
    capitalize: "capitalize",
  },
  code: "editor-code relative mb-3 block overflow-x-auto border-2 border-border bg-muted p-3 font-mono text-xs sm:text-sm leading-relaxed [tab-size:2] [white-space:pre]",
  collapsibleContainer:
    "editor-collapsible my-2 w-full border-2 border-border bg-card text-card-foreground shadow-[2px_2px_0_0_var(--border)] first:mt-0 last:mb-0",
  collapsibleTitle:
    "relative block cursor-pointer list-none py-2 pe-3 ps-7 text-start text-sm font-bold outline-none select-none hover:underline",
  collapsibleContent: "pt-0 pe-3 pb-2 ps-7 text-sm",
  codeHighlight: {
    inserted: "bg-emerald-500/15 text-emerald-700",
    deleted: "bg-red-500/15 text-red-700",
  },
  tableScrollableWrapper:
    "editor-table-scrollable-wrapper relative my-3 w-full overflow-x-auto",
  table: "w-full table-fixed border-collapse border-2 border-border text-sm",
  tableRow: "border-b border-border transition-colors hover:bg-muted/40",
  tableCell:
    "editor-table-cell relative border border-border p-2 text-start align-middle outline-none",
  tableCellHeader: "bg-muted text-start font-bold",
  tableCellSelected: "editor-table-cell-selected",
  tableSelected: "editor-table-selected",
  tableSelection: "editor-table-selection",
  tableAlignment: {
    center: "mx-auto",
    right: "ms-auto",
  },
};
