"use client";

import { useState } from "react";
import type { StudentDashboardData } from "../queries";
import { CheckinForm } from "./checkin-form";
import { DailyPlanView } from "./daily-plan-view";

export function StudentDashboardHub({ data }: { data: StudentDashboardData }) {
  const [isEditingCheckin, setIsEditingCheckin] = useState<boolean>(false);

  // If student hasn't checked in today yet, show the 30s CheckinForm directly
  const hasCheckedInToday = Boolean(data.todayCheckin && data.todayPlan);

  if (!hasCheckedInToday || isEditingCheckin) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <CheckinForm
          initialConsent={data.profile?.wellbeingConsent ?? true}
          initialEnergy={data.todayCheckin?.energy ?? 3}
          initialMood={data.todayCheckin?.mood ?? 3}
          initialNote={data.todayCheckin?.note ?? ""}
          initialSleep={data.todayCheckin?.sleepHours ?? 6.5}
          initialStress={data.todayCheckin?.stress ?? 2}
          onSuccess={() => setIsEditingCheckin(false)}
        />

        {data.todayPlan && isEditingCheckin && (
          <div className="text-center">
            <button
              className="text-xs text-muted-foreground underline hover:text-foreground"
              onClick={() => setIsEditingCheckin(false)}
              type="button"
            >
              Batalkan perubahan & kembali ke rencana hari ini
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <DailyPlanView
      data={data}
      onEditCheckin={() => setIsEditingCheckin(true)}
    />
  );
}
