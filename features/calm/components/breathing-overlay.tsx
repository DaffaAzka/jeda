"use client";

import { useEffect, useState, useRef } from "react";
import { siteCopy } from "@/lib/copy/id";

interface BreathingOverlayProps {
  isOpen: boolean;
  onClose: (pausedSeconds: number) => void;
  isFullSimulation?: boolean;
}

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut";

const PHASES: Array<{ phase: BreathPhase; label: string; duration: number }> = [
  { phase: "inhale", label: siteCopy.practice.breathingInhale, duration: 4 },
  { phase: "holdIn", label: siteCopy.practice.breathingHoldIn, duration: 4 },
  { phase: "exhale", label: siteCopy.practice.breathingExhale, duration: 4 },
  { phase: "holdOut", label: siteCopy.practice.breathingHoldOut, duration: 4 },
];

export function BreathingOverlay({
  isOpen,
  onClose,
  isFullSimulation = false,
}: BreathingOverlayProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(4);
  const [totalSecondsOpen, setTotalSecondsOpen] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isOpen) return;

    startTimeRef.current = Date.now();
    setPhaseIndex(0);
    setSecondsInPhase(4);
    setTotalSecondsOpen(0);

    const interval = setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev <= 1) {
          setPhaseIndex((p) => (p + 1) % PHASES.length);
          return 4;
        }
        return prev - 1;
      });

      setTotalSecondsOpen((sec) => sec + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPhase = PHASES[phaseIndex]!;

  function handleClose() {
    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    onClose(elapsedSeconds);
  }

  return (
    <div
      aria-labelledby="breathing-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="pixel-shadow flex max-w-md w-full flex-col items-center justify-between border-2 border-border bg-card p-6 text-center sm:p-8">
        <div className="space-y-1">
          <span className="inline-block border border-border bg-moodi-peach px-2.5 py-0.5 text-xs font-semibold text-ink">
            {siteCopy.practice.panicButton}
          </span>
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            id="breathing-title"
          >
            Tarik Napas Sejenak
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isFullSimulation
              ? siteCopy.practice.panicFullNotice
              : siteCopy.practice.panicLooseNotice}
          </p>
        </div>

        {/* Breathing Animation Orb / Container */}
        <div className="my-8 flex size-48 sm:size-56 items-center justify-center relative">
          {/* Animated visual orb */}
          <div
            className={`flex size-40 sm:size-48 items-center justify-center rounded-none border-4 border-border transition-all duration-1000 motion-reduce:transition-none ${
              currentPhase.phase === "inhale"
                ? "scale-110 bg-moodi-sky/80"
                : currentPhase.phase === "holdIn"
                  ? "scale-110 bg-moodi-butter/80"
                  : currentPhase.phase === "exhale"
                    ? "scale-90 bg-moodi-peach/80"
                    : "scale-90 bg-moodi-pink/70"
            }`}
          >
            <div className="space-y-1 select-none">
              <p className="font-pixelify text-2xl font-bold text-ink">
                {currentPhase.label}
              </p>
              <p className="font-mono text-3xl font-bold text-ink">
                {secondsInPhase}
              </p>
            </div>
          </div>
        </div>

        {/* Text Fallback & Phase Step Counter for Accessibility */}
        <div className="space-y-1 mb-6 text-xs text-muted-foreground">
          <p>
            {siteCopy.practice.breathingStepCounter
              .replace("{current}", String(phaseIndex + 1))
              .replace("{total}", "4")}
          </p>
          <p className="hidden motion-reduce:block text-foreground font-medium">
            {siteCopy.practice.reducedMotionBreathingText}
          </p>
        </div>

        {/* Close Button */}
        <button
          className="pixel-press pixel-shadow min-h-12 w-full border-2 border-border bg-moodi-sky px-6 font-semibold text-ink hover:bg-moodi-sky/90"
          onClick={handleClose}
          type="button"
        >
          {siteCopy.practice.panicClose}
        </button>
      </div>
    </div>
  );
}
