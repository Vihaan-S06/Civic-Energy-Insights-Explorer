import { ADVISORS, getAdvisorReaction, calcGridStats, EnergySourceId } from "./gameData";
import { cn } from "@/lib/utils";

interface AdvisorsPanelProps {
  mix: Record<EnergySourceId, number>;
  compact?: boolean;
}

export function AdvisorsPanel({ mix, compact = false }: AdvisorsPanelProps) {
  const stats = calcGridStats(mix);

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
      {ADVISORS.map((advisor) => {
        const reaction = getAdvisorReaction(advisor, stats);
        const totalAllocated = Object.values(mix).reduce((a, b) => a + b, 0);
        const isNeutral = totalAllocated < 10;

        return (
          <div
            key={advisor.id}
            className="rounded-xl border bg-card p-4 flex gap-3 items-start shadow-sm"
          >
            <div className="text-2xl flex-shrink-0 mt-0.5">{advisor.emoji}</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-foreground">{advisor.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{advisor.role}</div>
              <p className="text-sm text-foreground/80 italic leading-snug">
                "{isNeutral ? advisor.concern : reaction}"
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
