import { RichTextView } from "@/components/editor/rich-text-view";

export function RichContent({
  content,
  className = "",
}: {
  content: unknown;
  className?: string;
}) {
  return <RichTextView content={content} className={className} />;
}
