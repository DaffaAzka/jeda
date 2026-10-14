"use client";

import { useId } from "react";
import { getAllowedLevels, type LevelOption } from "@/lib/practice/level-policy";
import type { TryoutMode } from "@/app/generated/prisma/enums";
import { siteCopy } from "@/lib/copy/id";

export function LevelPicker({
  value,
  onChange,
  mode,
  name = "level",
}: {
  value: TryoutMode;
  onChange: (level: TryoutMode) => void;
  mode?: "recovery" | "balanced" | "challenge" | null;
  name?: string;
}) {
  const groupLabelId = useId();
  const levels = getAllowedLevels(mode);

  return (
    <fieldset aria-labelledby={groupLabelId} className="space-y-3">
      <legend className="text-sm font-semibold text-foreground" id={groupLabelId}>
        {siteCopy.practice.selectLevel}
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((item: LevelOption) => {
          const isSelected = value === item.level;
          return (
            <label
              className={`pixel-press relative flex cursor-pointer flex-col justify-between border-2 border-border p-4 transition-colors ${
                isSelected
                  ? "bg-moodi-sky/30 shadow-[3px_3px_0_var(--border)] ring-2 ring-primary"
                  : "bg-card hover:bg-muted"
              }`}
              key={item.level}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixelify text-base font-bold text-foreground">
                    {item.label}
                  </span>
                  <input
                    checked={isSelected}
                    className="size-4 accent-foreground"
                    name={name}
                    onChange={() => onChange(item.level)}
                    type="radio"
                    value={item.level}
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>

              {item.recoveryNotice && (
                <div className="mt-3 border-t border-border/40 pt-2 text-xs text-foreground/80">
                  <span className="font-semibold text-ink">Catatan:</span> {item.recoveryNotice}
                </div>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
