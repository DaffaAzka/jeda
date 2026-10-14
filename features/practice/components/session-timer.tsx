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
  const onExpiryRef = useRef(onExpiry);
  useEffect(() => {
    onExpiryRef.current = onExpiry;
  }, [onExpiry]);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");

  useEffect(() => {
    if (!endsAt || isPaused) return;

    const clientOffset = new Date(serverNow).getTime() - Date.now();

    function calculateRemaining() {
      const nowServerAdjusted = Date.now() + clientOffset;
      const diff = Math.floor((new Date(endsAt!).getTime() - nowServerAdjusted) / 1000);
      return Math.max(0, diff);
    }

    const interval = setInterval(() => {
      const diff = calculateRemaining();
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onExpiryRef.current?.();
      } else if (diff === 600) {
        setSrAnnouncement("Sisa waktu 10 menit.");
      } else if (diff === 300) {
        setSrAnnouncement("Sisa waktu 5 menit.");
      } else if (diff === 60) {
        setSrAnnouncement("Sisa waktu 1 menit.");
      } else if (diff === 10) {
        setSrAnnouncement("Sisa waktu 10 detik.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, isPaused, serverNow]);

  if (!endsAt) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-muted-foreground">
        <span>∞</span>
        <span className="text-xs">Santai</span>
      </div>
    );
  }

  const seconds =
    remainingSeconds ??
    Math.max(
      0,
      Math.floor((new Date(endsAt).getTime() - new Date(serverNow).getTime()) / 1000),
    );
  const isLowTime = seconds <= 300; // 5 minutes or less

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
      <span>{formatRemaining(seconds)}</span>

      {/* Screen reader live region for milestones */}
      <span aria-live="polite" className="sr-only">
        {srAnnouncement}
      </span>
    </div>
  );
}
