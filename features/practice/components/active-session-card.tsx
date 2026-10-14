import Link from "next/link";
import { siteCopy } from "@/lib/copy/id";
import type { TryoutMode } from "@/app/generated/prisma/enums";

const levelLabels: Record<TryoutMode, string> = {
  relaxed: "Santai",
  timed: "Latihan waktu",
  full_simulation: "Simulasi penuh",
};

export interface ActiveSessionProps {
  session: {
    id: string;
    mode: TryoutMode;
    startedAt: Date;
    endsAt: Date | null;
    timeLimitSeconds: number | null;
    subtest: { id: string; name: string; code: string } | null;
    topic: { id: string; name: string } | null;
    _count: { answers: number };
  };
}

export function ActiveSessionCard({ session }: ActiveSessionProps) {
  const scopeTitle = session.topic
    ? session.topic.name
    : session.subtest?.name ?? "Sesi Latihan";

  const subtestBadge = session.topic && session.subtest ? session.subtest.name : null;

  return (
    <aside
      aria-labelledby="active-session-heading"
      className="pixel-shadow border-2 border-border bg-moodi-butter/30 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block border border-border bg-moodi-butter px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-ink">
              {levelLabels[session.mode]}
            </span>
            {subtestBadge && (
              <span className="text-xs text-muted-foreground">{subtestBadge}</span>
            )}
            <span className="text-xs text-muted-foreground">
              · {session._count.answers} {siteCopy.practice.questionNavigator.toLowerCase()}
            </span>
          </div>
          <h3
            className="font-pixelify text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            id="active-session-heading"
          >
            {scopeTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {siteCopy.practice.activeSessionSubtitle}
          </p>
        </div>

        <div className="shrink-0">
          <Link
            className="pixel-press pixel-shadow inline-flex min-h-12 items-center justify-center border-2 border-border bg-moodi-sky px-6 font-semibold text-ink hover:bg-moodi-sky/90"
            href={`/dashboard/sessions/${session.id}`}
          >
            {siteCopy.practice.resumeSession}
          </Link>
        </div>
      </div>
    </aside>
  );
}
