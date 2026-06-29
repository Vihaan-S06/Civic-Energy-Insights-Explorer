import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Zap, MapPin } from "lucide-react";
import {
  US_STATES,
  StateData,
  ENERGY_SOURCES,
  EnergySourceId,
  RANDOM_EVENTS,
  calcGridStats,
  initialGameState,
  GameState,
  ADVISORS,
} from "./game/gameData";
import { USMap } from "./game/USMap";
import { AdvisorsPanel } from "./game/AdvisorsPanel";
import { GameSimulator } from "./game/GameSimulator";
import { EndgameReport } from "./game/EndgameReport";
import { cn } from "@/lib/utils";

export default function Game() {
  const [gs, setGs] = useState<GameState>(initialGameState);

  const updateGs = useCallback((patch: Partial<GameState>) => {
    setGs((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Landing ──────────────────────────────────────────────────────────────
  if (gs.phase === "landing") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 px-3 py-1 text-sm font-semibold">
            ⚡ Energy Strategy Game
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Can you run an electric grid better than your state?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You become the Energy Director. Balance affordability, clean power, reliability, and public approval — from 2026 to 2030. No perfect answers. Just trade-offs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm max-w-2xl w-full">
          {[
            { icon: "💵", label: "Keep bills low" },
            { icon: "🌱", label: "Cut emissions" },
            { icon: "💡", label: "Keep lights on" },
            { icon: "🗳️", label: "Keep people happy" },
          ].map((g) => (
            <div key={g.label} className="rounded-xl border bg-card p-3 text-center">
              <div className="text-2xl mb-1">{g.icon}</div>
              <div className="font-medium text-xs">{g.label}</div>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="text-lg px-10 py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
          onClick={() => updateGs({ phase: "region" })}
        >
          Start Playing <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground">
          No account needed · Runs in your browser · ~5 min per playthrough
        </p>
      </div>
    );
  }

  // ── Region Selection ──────────────────────────────────────────────────────
  if (gs.phase === "region") {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">Choose Your Region</h1>
          <p className="text-muted-foreground">Click a highlighted state to become its Energy Director</p>
        </div>

        <USMap
          onSelect={(state) => updateGs({ phase: "region", region: state })}
          selected={gs.region?.abbr}
        />

        {gs.region && <RegionCard state={gs.region} onConfirm={() => updateGs({ phase: "advisors" })} />}

        {!gs.region && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {US_STATES.map((s) => (
              <button
                key={s.id}
                onClick={() => updateGs({ phase: "region", region: s })}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors hover:bg-muted/60",
                  gs.region?.id === s.id ? "border-emerald-500 bg-emerald-50" : "bg-card"
                )}
              >
                <div className="font-bold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.renewablePct}% renewable · {s.avgPriceCents}¢/kWh
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Advisors intro ────────────────────────────────────────────────────────
  if (gs.phase === "advisors") {
    const startMix = { ...gs.region!.mix };
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 px-3 py-1">
            <MapPin className="w-3 h-3 mr-1 inline" />
            {gs.region!.name} Energy Director
          </Badge>
          <h1 className="text-3xl font-black">Meet Your Advisors</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            These experts will react to every decision you make. Their concerns often conflict — that's the point.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADVISORS.map((a) => (
            <div key={a.id} className="rounded-xl border bg-card p-5 text-center space-y-2">
              <div className="text-4xl">{a.emoji}</div>
              <div className="font-bold">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.role}</div>
              <div className="text-sm italic text-foreground/70 border-t pt-2">"{a.concern}"</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/40 p-5">
          <h2 className="font-semibold mb-2">Your starting grid — {gs.region!.name} 2026</h2>
          <div className="flex flex-wrap gap-2">
            {ENERGY_SOURCES.map((src) => {
              const pct = startMix[src.id] ?? 0;
              if (pct === 0) return null;
              return (
                <div key={src.id} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm">
                  <span>{src.icon}</span>
                  <span className="font-medium">{src.label}</span>
                  <span className="font-bold" style={{ color: src.color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="px-10 py-5 text-base bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              const startStats = calcGridStats(startMix);
              updateGs({
                phase: "playing",
                mix: startMix,
                budget: gs.region!.budget,
                budgetSpent: 0,
                reliability: gs.region!.gridScore,
                year: 2026,
                yearHistory: [{ year: 2026, stats: startStats }],
              });
            }}
          >
            Begin as Energy Director <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (gs.phase === "playing" || gs.phase === "event") {
    function handleMixChange(newMix: Record<EnergySourceId, number>) {
      const stats = calcGridStats(newMix);
      const costDelta = Object.entries(newMix).reduce((sum, [id, pct]) => {
        const old = gs.mix[id as EnergySourceId] ?? 0;
        const delta = pct - old;
        const src = ENERGY_SOURCES.find((s) => s.id === id)!;
        return sum + (delta > 0 ? (delta / 100) * gs.region!.annualDemandTWh * 0.0005 * src.constructionBillions : 0);
      }, 0);
      updateGs({
        mix: newMix,
        budgetSpent: Math.min(gs.budget, gs.budgetSpent + Math.max(0, costDelta)),
      });
    }

    function handleAdvanceYear() {
      const nextYear = gs.year + 1;
      const stats = calcGridStats(gs.mix);

      // Check for blackout
      const newBlackouts = gs.blackoutCount + (gs.reliability < 55 ? 1 : 0);

      // Look for events in this year range
      const candidateEvents = RANDOM_EVENTS.filter(
        (e) => e.year === nextYear && !gs.seenEventIds.includes(e.id)
      );
      const event = candidateEvents.length > 0
        ? candidateEvents[Math.floor(Math.random() * candidateEvents.length)]
        : null;

      const newHistory = [...gs.yearHistory, { year: nextYear, stats }];

      if (event) {
        updateGs({
          year: nextYear,
          yearHistory: newHistory,
          blackoutCount: newBlackouts,
          pendingEvent: event,
          seenEventIds: [...gs.seenEventIds, event.id],
          phase: "event",
        });
      } else {
        updateGs({
          year: nextYear,
          yearHistory: newHistory,
          blackoutCount: newBlackouts,
          phase: "playing",
        });
      }
    }

    function handleAcknowledgeEvent() {
      if (!gs.pendingEvent) return;
      const ev = gs.pendingEvent;

      // Apply event effects
      const newMix = { ...gs.mix } as Record<EnergySourceId, number>;
      let budgetDelta = 0;
      let reliabilityDelta = 0;

      for (const [key, val] of Object.entries(ev.effects)) {
        if (key === "budgetDelta") { budgetDelta = val as number; continue; }
        if (key === "reliabilityDelta") { reliabilityDelta = val as number; continue; }
        if (key === "demandMultiplier" || key === "priceMultiplier") continue;
        const sid = key as EnergySourceId;
        newMix[sid] = Math.max(0, Math.min(100, (newMix[sid] ?? 0) + (val as number)));
      }

      // Clamp total to 100
      const total = Object.values(newMix).reduce((a, b) => a + b, 0);
      if (total > 100) {
        const scale = 100 / total;
        for (const k of Object.keys(newMix) as EnergySourceId[]) {
          newMix[k] = Math.round((newMix[k] ?? 0) * scale);
        }
      }

      const newBudget = Math.max(0, gs.budget + budgetDelta);
      const newReliability = Math.max(0, Math.min(100, gs.reliability + reliabilityDelta));

      updateGs({
        mix: newMix,
        budget: newBudget,
        reliability: newReliability,
        pendingEvent: null,
        phase: "playing",
      });
    }

    return (
      <div className="max-w-4xl mx-auto">
        <GameSimulator
          region={gs.region!}
          year={gs.year}
          mix={gs.mix}
          budget={gs.budget}
          budgetSpent={gs.budgetSpent}
          reliability={gs.reliability}
          pendingEvent={gs.pendingEvent}
          onMixChange={handleMixChange}
          onAdvanceYear={handleAdvanceYear}
          onAcknowledgeEvent={handleAcknowledgeEvent}
          onFinish={() => updateGs({ phase: "report" })}
          blackoutCount={gs.blackoutCount}
        />
      </div>
    );
  }

  // ── Report ────────────────────────────────────────────────────────────────
  if (gs.phase === "report") {
    return (
      <EndgameReport
        state={gs}
        onRestart={() => setGs(initialGameState())}
      />
    );
  }

  return null;
}

function RegionCard({ state, onConfirm }: { state: StateData; onConfirm: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/60 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black">{state.name}</h2>
          <p className="text-sm text-muted-foreground">
            Population: {(state.population / 1_000_000).toFixed(1)}M ·{" "}
            Annual demand: {state.annualDemandTWh} TWh
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={onConfirm}
        >
          Become Energy Director <Zap className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Price", value: `${state.avgPriceCents}¢`, sub: "per kWh" },
          { label: "Grid Score", value: `${state.gridScore}/100`, sub: "reliability" },
          { label: "Renewables", value: `${state.renewablePct}%`, sub: "of generation" },
          { label: "Budget", value: `$${state.budget}B`, sub: "annual" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-xl font-bold text-emerald-700">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Current Challenges</div>
        <div className="flex flex-wrap gap-2">
          {state.challenges.map((c) => (
            <Badge key={c} variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
              ⚠️ {c}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Starting Energy Mix</div>
        <div className="flex flex-wrap gap-2">
          {ENERGY_SOURCES.map((src) => {
            const pct = state.mix[src.id] ?? 0;
            if (pct === 0) return null;
            return (
              <div key={src.id} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm">
                <span>{src.icon}</span>
                <span>{src.label}</span>
                <span className="font-bold" style={{ color: src.color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
