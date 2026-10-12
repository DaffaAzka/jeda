import Link from "next/link";
import type { ReactNode } from "react";

/** Static page header. It reads no data, so it ships in the instant shell. */
export function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  action,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <>
      <Link
        className="text-sm font-semibold text-link underline underline-offset-4"
        href={backHref}
      >
        ← {backLabel}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-pixelify text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </>
  );
}
