import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { Button } from "../components/Button";
import { AlertBanner } from "../components/AlertBanner";
import { BottomNav } from "../components/BottomNav";
import {
  IconPower,
  IconWater,
  IconBell,
  IconCheck,
  IconClock,
} from "../components/icons";

export function SchedulesScreen() {
  const {
    scheduledOutages,
    toggleOutageReminder,
    visitedScreens,
    markScreenVisited,
  } = useData();

  const [todayReminderDismissed, setTodayReminderDismissed] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(
    () => !visitedScreens["schedules"]
  );

  useEffect(() => {
    if (!visitedScreens["schedules"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("schedules");
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [visitedScreens, markScreenVisited]);

  const todayOutageWithReminder = scheduledOutages.find(
    (o) => o.day === "Today" && o.reminderSet
  );

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="Outage Schedules"
        subtitle="Planned water and electricity outages for the next few days"
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-4">
        {/* Day-of Reminder Banner */}
        {todayOutageWithReminder && !todayReminderDismissed && (
          <AlertBanner
            variant="warning"
            icon="power"
            text={`Reminder for Today: ${todayOutageWithReminder.title} at ${todayOutageWithReminder.timeSlot} in ${todayOutageWithReminder.location}.`}
            onDismiss={() => setTodayReminderDismissed(true)}
          />
        )}

        {loading ? (
          <div className="flex flex-col gap-3" aria-label="Loading schedules">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                  <div className="flex-1">
                    <div className="h-[16px] w-[180px] rounded bg-[#E5E7EB] mb-2" />
                    <div className="h-[12px] w-[140px] rounded bg-[#E5E7EB]" />
                  </div>
                </div>
                <div className="h-[48px] w-full rounded-[12px] bg-[#E5E7EB]" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {scheduledOutages.map((outage) => {
              const isPower = outage.type === "power";
              const isToday = outage.day === "Today";

              return (
                <Card key={outage.id}>
                  <div className="flex items-start gap-3 mb-3">
                    <IconCircle
                      size="md"
                      color={isPower ? "amber" : "blue"}
                      icon={isPower ? IconPower : IconWater}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={[
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-[0.05em]",
                            isToday
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#F7F8FA] text-[#111827] border border-[#E5E7EB]",
                          ].join(" ")}
                        >
                          {outage.day}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#111827]">
                          <IconClock size={14} className="text-[#6B7280]" />
                          {outage.timeSlot}
                        </span>
                      </div>

                      <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] break-words">
                        {outage.title}
                      </h3>
                      <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mt-0.5">
                        {outage.location}
                      </p>
                      <p className="text-[12px] font-normal leading-[1.4] text-[#111827] mt-1.5">
                        {outage.note}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={outage.reminderSet ? "secondary" : "primary"}
                    size="md"
                    fullWidth
                    onClick={() => toggleOutageReminder(outage.id)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {outage.reminderSet ? (
                        <>
                          <IconCheck size={18} />
                          Reminder on for {outage.day}
                        </>
                      ) : (
                        <>
                          <IconBell size={18} />
                          Remind me on the day
                        </>
                      )}
                    </span>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
