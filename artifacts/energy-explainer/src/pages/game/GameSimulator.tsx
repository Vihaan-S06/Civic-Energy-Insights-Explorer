import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ENERGY_SOURCES,
  EnergySourceId,
  StateData,
  calcGridStats,
  GameEvent,
} from "./gameData";
import { AdvisorsPanel } from "./AdvisorsPanel";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Zap, DollarSign, Leaf, Shield, ThumbsUp, Info } from "lucide-react";

interface GameSimulatorProps {
  region: StateData;
  year: number;
  mix: Record<EnergySourceId, number>;
  budget: number;
  budgetSpent: number;
  reliability: number;
  pendingEvent: GameEvent | null;
  onMixChange: (mix: Record<EnergySourceId, number>) => void;
  onAdvanceYear: () => void;
  onAcknowledgeEvent: () => void;
  onFinish: () => void;
  blackoutCount: number;
}

const STAT_GRADE: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-50 border-emerald-200",
  A: "text-emerald-600 bg-emerald-50 border-emerald-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-amber-600 bg-amber-50 border-amber-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-red-600 bg-red-50 border-red-200",
};

export function GameSimulator({
  region,
  year,
  mix,
  budget,
  budgetSpent,
  reliability,
  pendingEvent,
  onMixChange,
  onAdvanceYear,
  onAcknowledgeEvent,
  onFinish,
  blackoutCount,
}: GameSimulatorProps) {
  const [flashId, setFlashId] = useState<EnergySourceId | null>(null);

  const stats = calcGridStats(mix);
  const totalAllocated = stats.totalPct;
  const remaining = Math.max(0, 100 - totalAllocated);
  const budgetRemaining = budget - budgetSpent;

  function handleSlider(id: EnergySourceId, value: number) {
    const current = mix[id] ?? 0;
    const delta = value - current;
    if (delta > remaining + current - current && totalAllocated - current + value > 100) {
      setFlashId(id);
      setTimeout(() => setFlashId(null), 600);
      return;
    }
    const newVal = Math.max(0, Math.min(100, value));
    const newTotal = totalAllocated - current + newVal;
    if (newTotal > 100) {
      setFlashId(id);
      setTimeout(() => setFlashId(null), 600);
      return;
    }
    onMixChange({ ...mix, [id]: newVal });
  }

  const isLastYear = year >= 2030;

  if (pendingEvent) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 text-center space-y-4">
          <div className="text-5xl">{pendingEvent.emoji}</div>
          <h2 className="text-2xl font-bold text-amber-900">{pendingEvent.title}</h2>
          <p className="text-amber-800 text-base leading-relaxed">{pendingEvent.description}</p>

          <div className="bg-white rounded-xl border border-amber-200 p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-amber-900 mb-2">Impact on your grid:</p>
            {pendingEvent.effects.budgetDelta !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>
                  Budget{" "}
                  {pendingEvent.effects.budgetDelta > 0 ? (
                    <span className="text-emerald-600 font-semibold">
                      +${pendingEvent.effects.budgetDelta}B
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      -${Math.abs(pendingEvent.effects.budgetDelta)}B
                    </span>
                  )}
                </span>
              </div>
            )}
            {pendingEvent.effects.reliabilityDelta !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>
                  Reliability{" "}
                  {pendingEvent.effects.reliabilityDelta > 0 ? (
                    <span className="text-emerald-600 font-semibold">
                      +{pendingEvent.effects.reliabilityDelta}
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      {pendingEvent.effects.reliabilityDelta}
                    </span>
                  )}
                </span>
              </div>
            )}
            {pendingEvent.effects.demandMultiplier !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>
                  Demand{" "}
                  <span className={pendingEvent.effects.demandMultiplier > 1 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                    {pendingEvent.effects.demandMultiplier > 1 ? "+" : ""}
                    {Math.round((pendingEvent.effects.demandMultiplier - 1) * 100)}%
                  </span>
                </span>
              </div>
            )}
            {(["gas", "coal", "nuclear", "wind", "solar", "hydro"] as EnergySourceId[]).map((sid) => {
              const delta = pendingEvent.effects[sid];
              if (delta == null) return null;
              const src = ENERGY_SOURCES.find((s) => s.id === sid)!;
              return (
                <div key={sid} className="flex items-center gap-2 text-sm">
                  <span>{src.icon}</span>
                  <span>
                    {src.label}{" "}
                    {delta > 0 ? (
                      <span className="text-emerald-600 font-semibold">+{delta}%</span>
                    ) : (
                      <span className="text-red-600 font-semibold">{delta}%</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <Button className="w-full" onClick={onAcknowledgeEvent}>
            Adapt and continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{region.name} Energy Director</h2>
            <Badge variant="outline" className="text-base font-bold px-3 py-1">
              {year}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Years left: {2030 - year} — Advance year to trigger events and lock in your choices
          </p>
        </div>
        <div className="flex gap-2">
          {!isLastYear ? (
            <Button onClick={onAdvanceYear} variant="outline">
              Advance to {year + 1} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={onFinish} className="bg-emerald-600 hover:bg-emerald-700">
              View Final Report <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Leaf className="w-4 h-4 text-emerald-500" />}
          label="Renewables"
          value={`${Math.round(stats.renewablePct)}%`}
          sub={`CO₂: ${Math.round(stats.co2)}g/kWh`}
          color="emerald"
          score={stats.renewScore}
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4 text-blue-500" />}
          label="Price"
          value={`${stats.price.toFixed(1)}¢`}
          sub="per kWh"
          color="blue"
          score={stats.priceScore}
        />
        <StatCard
          icon={<Shield className="w-4 h-4 text-violet-500" />}
          label="Reliability"
          value={`${Math.round(reliability)}%`}
          sub={blackoutCount > 0 ? `${blackoutCount} blackout${blackoutCount > 1 ? "s" : ""}` : "No blackouts"}
          color="violet"
          score={Math.round(reliability)}
        />
        <StatCard
          icon={<ThumbsUp className="w-4 h-4 text-amber-500" />}
          label="Approval"
          value={`${Math.round(stats.approval)}%`}
          sub="public support"
          color="amber"
          score={Math.round(stats.approval)}
        />
      </div>

      {/* Budget */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Annual Budget
          </span>
          <span className="text-sm font-bold">
            ${budgetRemaining.toFixed(1)}B remaining of ${budget}B
          </span>
        </div>
        <Progress
          value={Math.min(100, (budgetSpent / budget) * 100)}
          className="h-2"
        />
        {budgetRemaining < 5 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low budget — prioritize your investments carefully.
          </p>
        )}
      </div>

      {/* Grid allocation */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Grid Allocation</h3>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "text-sm font-bold",
                totalAllocated > 100 ? "text-red-600" : totalAllocated === 100 ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {Math.round(totalAllocated)}% / 100%
            </div>
            <div
              className={cn(
                "text-2xl font-black border-2 rounded-lg px-3 py-1",
                STAT_GRADE[stats.grade]
              )}
            >
              {stats.grade}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {ENERGY_SOURCES.map((src) => {
            const val = mix[src.id] ?? 0;
            const cost = (val / 100) * region.annualDemandTWh * 0.001 * src.constructionBillions;
            return (
              <div key={src.id} className={cn("space-y-2", flashId === src.id && "animate-pulse")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{src.icon}</span>
                    <span className="font-medium text-sm">{src.label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        <p>{src.description}</p>
                        <p className="mt-1 text-muted-foreground">
                          CO₂: {src.co2}g/kWh · Reliability: {src.reliabilityScore}% · Build: {src.constructionYears}y
                        </p>
                        <p className="text-muted-foreground">Public approval: {src.publicApproval}%</p>
                      </TooltipContent>
                    </Tooltip>
                    {src.isRenewable && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 py-0">
                        Clean
                      </Badge>
                    )}
                    {src.weatherDependent && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 py-0">
                        Variable
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-muted-foreground">${cost.toFixed(1)}B/yr</span>
                    <span className="font-bold text-sm w-10 text-right" style={{ color: src.color }}>
                      {val}%
                    </span>
                  </div>
                </div>

                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[val]}
                  onValueChange={([v]) => handleSlider(src.id, v)}
                  className="w-full"
                  style={
                    {
                      "--slider-thumb": src.color,
                      "--slider-track": src.color,
                    } as React.CSSProperties
                  }
                />

                {/* Mini bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${val}%`, backgroundColor: src.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {remaining > 0 && totalAllocated > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {remaining}% unallocated — grid will underperform without full capacity
          </p>
        )}
      </div>

      {/* Advisors */}
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
          Advisor Reactions
        </h3>
        <AdvisorsPanel mix={mix} compact />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "emerald" | "blue" | "violet" | "amber";
  score: number;
}) {
  const colors = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
    amber: "text-amber-600",
  };
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        <span className="uppercase tracking-wide font-medium">{label}</span>
      </div>
      <div className={cn("text-xl font-bold", colors[color])}>{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-emerald-500": color === "emerald",
            "bg-blue-500": color === "blue",
            "bg-violet-500": color === "violet",
            "bg-amber-500": color === "amber",
          })}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
