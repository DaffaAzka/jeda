"use client";

import { useEffect, useState, useRef } from "react";

interface SessionTimerProps {
  endsAt: string | null;
  serverNow: string;
  onExpiry?: () => void;
  isPaused?: boolean;
}

function formatRemaining(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionTimer({
  endsAt,
  serverNow,
  onExpiry,
  isPaused = false,
}: SessionTimerProps) {
  const clientOffsetRef = useRef<number>(
    new Date(serverNow).getTime() - Date.now(),
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!endsAt) return null;
    const nowServerAdjusted = Date.now() + clientOffsetRef.current;
    const diff = Math.floor((new Date(endsAt).getTime() - nowServerAdjusted) / 1000);
    return Math.max(0, diff);
  });

  const onExpiryRef = useRef(onExpiry);
  onExpiryRef.current = onExpiry;

  const [srAnnouncement, setSrAnnouncement] = useState<string>("");

  useEffect(() => {
    if (!endsAt) {
      setRemainingSeconds(null);
      return;
    }

    if (isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const nowServerAdjusted = Date.now() + clientOffsetRef.current;
      const diff = Math.floor((new Date(endsAt).getTime() - nowServerAdjusted) / 1000);

      if (diff <= 0) {
        setRemainingSeconds(0);
        clearInterval(interval);
        onExpiryRef.current?.();
      } else {
        setRemainingSeconds(diff);

        // Screen reader announcement at key milestones
        if (diff === 600) {
          setSrAnnouncement("Sisa waktu 10 menit.");
        } else if (diff === 300) {
          setSrAnnouncement("Sisa waktu 5 menit.");
        } else if (diff === 60) {
          setSrAnnouncement("Sisa waktu 1 menit.");
        } else if (diff === 10) {
          setSrAnnouncement("Sisa waktu 10 detik.");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, isPaused]);

  if (remainingSeconds === null) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-muted-foreground">
        <span>∞</span>
        <span className="text-xs">Santai</span>
      </div>
    );
  }

  const isLowTime = remainingSeconds <= 300; // 5 minutes or less

  return (
    <div
      aria-label="Waktu tersisa"
      className={`flex items-center gap-2 border border-border px-3 py-1 font-mono text-base font-bold sm:text-lg ${
        isLowTime ? "bg-moodi-peach text-ink" : "bg-card text-foreground"
      }`}
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formatRemaining(remainingSeconds)}</span>

      {/* Screen reader live region for milestones */}
      <span aria-live="polite" className="sr-only">
        {srAnnouncement}
      </span>
    </div>
  );
}
