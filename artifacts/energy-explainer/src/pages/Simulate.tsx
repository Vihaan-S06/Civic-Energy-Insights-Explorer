import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { RefreshCw, ArrowRight, ArrowUp, ArrowDown, Share2, Check, Info, Zap, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmitChallengeSimulator } from "@workspace/api-client-react";

const SOURCES = [
  { id: "natural_gas", label: "Natural Gas", category: "fossil", co2: 490, costMultiplier: 1.0, color: "#f59e0b",
    tooltip: "Burns natural gas to spin turbines. Flexible but releases CO₂ and methane — a potent greenhouse gas." },
  { id: "coal", label: "Coal", category: "fossil", co2: 820, costMultiplier: 0.8, color: "#78716c",
    tooltip: "The dirtiest electricity source. Burns crushed rock to make steam — heavy CO₂ and air pollution." },
  { id: "nuclear", label: "Nuclear", category: "nuclear", co2: 12, costMultiplier: 1.2, color: "#8b5cf6",
    tooltip: "Splits uranium atoms to make heat, then electricity. Zero air pollution, very low CO₂, runs 24/7." },
  { id: "wind", label: "Wind", category: "renewable", co2: 11, costMultiplier: 0.9, color: "#06b6d4",
    tooltip: "Spinning blades catch moving air. Zero emissions while running, but only works when the wind blows." },
  { id: "solar", label: "Solar", category: "renewable", co2: 45, costMultiplier: 0.85, color: "#eab308",
    tooltip: "Panels turn sunlight into electricity. Fastest-growing energy source — but only works during daylight." },
  { id: "hydro", label: "Hydro", category: "renewable", co2: 4, costMultiplier: 0.7, color: "#3b82f6",
    tooltip: "Flowing water spins generators in dams. Reliable and very clean, but limited by geography and drought." },
];

const PRESETS = [
  {
    label: "Current US",
    icon: "🇺🇸",
    mix: { natural_gas: 42, coal: 18, nuclear: 18, wind: 10, solar: 6, hydro: 6 },
  },
  {
    label: "100% Renewable",
    icon: "🌿",
    mix: { natural_gas: 0, coal: 0, nuclear: 0, wind: 40, solar: 40, hydro: 20 },
  },
  {
    label: "Lowest Carbon",
    icon: "🌡️",
    mix: { natural_gas: 0, coal: 0, nuclear: 50, wind: 25, solar: 15, hydro: 10 },
  },
  {
    label: "Lowest Cost",
    icon: "💰",
    mix: { natural_gas: 40, coal: 30, nuclear: 15, wind: 10, solar: 3, hydro: 2 },
  },
  {
    label: "Texas Style",
    icon: "⭐",
    mix: { natural_gas: 45, coal: 20, nuclear: 4, wind: 25, solar: 6, hydro: 0 },
  },
  {
    label: "California Style",
    icon: "☀️",
    mix: { natural_gas: 27, coal: 0, nuclear: 9, wind: 10, solar: 42, hydro: 12 },
  },
] as const;

const INITIAL_MIX = PRESETS[0].mix as Record<string, number>;
const BASE_PRICE = 12.7;
const US_AVERAGE = { renewable: 21, co2: 386, price: 12.7 };

function parseMixFromSearch(): Record<string, number> | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const keys: Record<string, string> = {
      gas: "natural_gas", coal: "coal", nuclear: "nuclear",
      wind: "wind", solar: "solar", hydro: "hydro",
    };
    const mix: Record<string, number> = {};
    let found = false;
    for (const [short, full] of Object.entries(keys)) {
      const val = params.get(short);
      if (val !== null) {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n >= 0 && n <= 100) {
          mix[full] = n;
          found = true;
        }
      }
    }
    if (!found) return null;
    const total = Object.values(mix).reduce((s, v) => s + v, 0);
    if (total > 100) return null;
    for (const s of SOURCES) {
      if (!(s.id in mix)) mix[s.id] = 0;
    }
    return mix;
  } catch {
    return null;
  }
}

function mixToSearchParams(mix: Record<string, number>): string {
  const short: Record<string, string> = {
    natural_gas: "gas", coal: "coal", nuclear: "nuclear",
    wind: "wind", solar: "solar", hydro: "hydro",
  };
  const params = new URLSearchParams();
  for (const [id, val] of Object.entries(mix)) {
    if (val > 0 && short[id]) params.set(short[id], String(val));
  }
  return params.toString();
}

function calcGridScore(renewable: number, co2: number, price: number) {
  const rScore = Math.min(100, renewable);
  const co2Score = Math.max(0, Math.min(100, ((800 - co2) / 800) * 100));
  const priceScore = Math.max(0, Math.min(100, ((25 - price) / 15) * 100));
  const total = Math.round(rScore * 0.4 + co2Score * 0.4 + priceScore * 0.2);

  if (total >= 75) return { score: total, grade: "A", label: "Excellent", color: "text-green-600", bg: "bg-green-50 border-green-200" };
  if (total >= 60) return { score: total, grade: "B", label: "Good", color: "text-teal-600", bg: "bg-teal-50 border-teal-200" };
  if (total >= 45) return { score: total, grade: "C", label: "Average", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  if (total >= 30) return { score: total, grade: "D", label: "Below Average", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  return { score: total, grade: "F", label: "High Emissions", color: "text-red-600", bg: "bg-red-50 border-red-200" };
}

function generateInsights(mix: Record<string, number>, stats: { renewable: number; co2: number; price: string }): string[] {
  const insights: string[] = [];
  const renewable = stats.renewable;
  const co2 = stats.co2;
  const price = parseFloat(stats.price);
  const co2Reduction = Math.round(((386 - co2) / 386) * 100);

  if (renewable === 0 && mix.nuclear > 0) {
    insights.push(`Nuclear carries this grid — CO₂ is ${co2} g/kWh, far below the ${386} g US average, even with zero renewables.`);
  } else if (renewable >= 90) {
    insights.push("Almost fully renewable! This grid would need significant battery or hydro storage to handle overnight and calm periods.");
  } else if (renewable >= 70) {
    insights.push(`At ${renewable}% renewable, this grid would cut electricity-sector emissions by ${co2Reduction}% compared to the US average.`);
  } else if (renewable >= 40) {
    insights.push(`${renewable}% clean energy is well above the US average of 21%. Expanding wind or solar could push this grid into a top-tier ranking.`);
  }

  if (mix.coal > 30) {
    insights.push(`Coal at ${mix.coal}% is the biggest emissions driver — swapping just half of it for natural gas or wind would sharply cut CO₂.`);
  }

  if (co2 < 150) {
    insights.push(`At ${co2} g/kWh, this grid is cleaner than France's nuclear-heavy system. If all US states matched this, national power-sector emissions would drop ~60%.`);
  } else if (co2 > 550) {
    insights.push(`${co2} g/kWh is among the highest possible — comparable to burning pure coal. Replacing some coal with gas or wind would significantly help.`);
  }

  if (price < 9) {
    const cheapSources = SOURCES.filter(s => mix[s.id] > 0 && s.costMultiplier < 1.0).map(s => s.label);
    insights.push(`This is one of the cheapest grid configurations possible${cheapSources.length ? `, driven by ${cheapSources.slice(0, 2).join(" and ")}` : ""}.`);
  } else if (price > 18) {
    insights.push(`At ${price}¢/kWh this mix would raise electricity bills significantly above the US average of 12.7¢.`);
  }

  if (mix.wind > 40 || mix.solar > 40) {
    insights.push("Heavy reliance on a single variable source creates intermittency challenges — the grid needs storage or backup to stay reliable around the clock.");
  }

  if (renewable === 100) {
    insights.push("A fully renewable grid is theoretically achievable today. The challenge is balancing supply and demand — batteries, pumped-hydro, and smart grids make it possible.");
  }

  if (insights.length === 0) {
    insights.push(`This grid sits close to the US average across all metrics — a mix of cost-effective reliability and moderate emissions at ${co2} g/kWh.`);
  }

  return insights.slice(0, 3);
}

export default function Simulate() {
  const initialMix = useMemo(() => parseMixFromSearch() ?? { ...INITIAL_MIX }, []);
  const [mix, setMix] = useState<Record<string, number>>(initialMix);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [simTeam, setSimTeam] = useState<{ id: string; name: string } | null>(null);
  const [simResult, setSimResult] = useState<{ points: number; badge: string | null } | null>(null);
  const { mutateAsync: submitChallenge, isPending: isSubmitting } = useSubmitChallengeSimulator();

  useEffect(() => {
    const saved = localStorage.getItem("challenge_team");
    if (saved) {
      try {
        const t = JSON.parse(saved) as { id: string; name: string };
        setSimTeam({ id: t.id, name: t.name });
      } catch { /* ignore */ }
    }
  }, []);

  const totalPercent = useMemo(
    () => Object.values(mix).reduce((sum, v) => sum + Math.max(0, v), 0),
    [mix]
  );
  const remaining = Math.max(0, 100 - totalPercent);

  const handleSliderChange = useCallback((id: string, requested: number) => {
    const safeRequested = Math.max(0, requested);
    setMix((prev) => {
      const current = prev[id] ?? 0;
      const otherTotal = Object.values(prev).reduce((s, v) => s + v, 0) - current;
      const budget = 100 - otherTotal;
      const capped = Math.min(safeRequested, budget);
      if (safeRequested > budget && safeRequested > current) {
        if (flashTimer.current) clearTimeout(flashTimer.current);
        setFlashId(id);
        flashTimer.current = setTimeout(() => setFlashId(null), 600);
      }
      if (capped === current) return prev;
      return { ...prev, [id]: capped };
    });
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setMix({ ...preset.mix } as Record<string, number>);
  }, []);

  const distributeRemaining = useCallback(() => {
    setMix((prev) => {
      const total = Object.values(prev).reduce((s, v) => s + v, 0);
      const rem = 100 - total;
      if (rem <= 0) return prev;
      const active = Object.keys(prev).filter((k) => prev[k] > 0);
      if (active.length === 0) return prev;
      const add = rem / active.length;
      const newMix = { ...prev };
      active.forEach((k) => { newMix[k] = Math.round((newMix[k] + add) * 10) / 10; });
      const drift = Math.round((Object.values(newMix).reduce((s, v) => s + v, 0) - 100) * 10) / 10;
      if (drift !== 0) {
        const key = active[0];
        newMix[key] = Math.max(0, Math.round((newMix[key] - drift) * 10) / 10);
      }
      return newMix;
    });
  }, []);

  const reset = useCallback(() => setMix({ ...INITIAL_MIX }), []);

  const handleShare = useCallback(async () => {
    const qs = mixToSearchParams(mix);
    const base = window.location.origin + window.location.pathname;
    const url = qs ? `${base}?${qs}` : base;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }, [mix]);

  useEffect(() => {
    const qs = mixToSearchParams(mix);
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [mix]);

  const stats = useMemo(() => {
    const total = totalPercent > 0 ? totalPercent : 1;
    let co2 = 0, costMulti = 0, renewablePct = 0;
    Object.entries(mix).forEach(([id, val]) => {
      const source = SOURCES.find((s) => s.id === id)!;
      const weight = Math.max(0, val) / total;
      co2 += source.co2 * weight;
      costMulti += source.costMultiplier * weight;
      if (source.category === "renewable") renewablePct += weight * 100;
    });
    return {
      co2: Math.round(co2),
      price: (BASE_PRICE * costMulti).toFixed(1),
      renewable: Math.round(renewablePct),
    };
  }, [mix, totalPercent]);

  const gridScore = useMemo(
    () => calcGridScore(stats.renewable, stats.co2, parseFloat(stats.price)),
    [stats]
  );

  const insights = useMemo(() => generateInsights(mix, stats), [mix, stats]);

  const chartData = SOURCES.map((s) => ({
    name: s.label,
    value: Math.max(0, mix[s.id] ?? 0),
    color: s.color,
  })).filter((d) => d.value > 0);

  const totalBg =
    totalPercent === 100
      ? "bg-green-50 border-green-200 text-green-700"
      : totalPercent < 100
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary">
          Energy Mix Simulator
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Design your own power grid. Pick a preset or drag the sliders — the total can never exceed 100%.
        </p>
      </div>

      {/* Presets */}
      <section aria-label="Grid presets">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="h-9 gap-1.5 text-sm hover:bg-primary/10 hover:border-primary transition-colors"
              aria-label={`Apply ${preset.label} preset`}
            >
              <span role="img" aria-hidden="true">{preset.icon}</span>
              {preset.label}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="font-display">Energy Sources</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="h-8 gap-1.5 text-xs"
                  aria-label="Copy shareable link to this mix"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5" /> Share</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={reset}
                  className="text-muted-foreground h-8 gap-1.5"
                  aria-label="Reset to US average mix"
                  data-testid="btn-reset"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {SOURCES.map((source) => {
                const current = mix[source.id] ?? 0;
                const otherTotal = totalPercent - current;
                const budget = Math.max(current, 100 - otherTotal);
                const isFlashing = flashId === source.id;

                return (
                  <div key={source.id} className="space-y-2" data-testid={`source-row-${source.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: source.color }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-sm">{source.label}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 h-4 px-1.5 font-normal",
                            source.category === "renewable" && "border-teal-300 text-teal-700 bg-teal-50",
                            source.category === "nuclear" && "border-purple-300 text-purple-700 bg-purple-50",
                            source.category === "fossil" && "border-stone-300 text-stone-600 bg-stone-50",
                          )}
                        >
                          {source.category === "renewable" ? "clean" : source.category}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button aria-label={`Info about ${source.label}`} className="text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-56 text-xs">{source.tooltip}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFlashing && (
                          <span className="text-[10px] font-semibold text-red-500 animate-in fade-in duration-150" role="alert">
                            Budget full
                          </span>
                        )}
                        <span className="font-mono font-semibold text-sm tabular-nums w-10 text-right" aria-label={`${source.label}: ${current} percent`}>
                          {current}%
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[current]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(vals) => handleSliderChange(source.id, vals[0] ?? 0)}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-opacity",
                        isFlashing && "opacity-70"
                      )}
                      aria-label={`${source.label} percentage`}
                      aria-valuenow={current}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      data-testid={`slider-${source.id}`}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span>
                        {remaining > 0
                          ? `${remaining}% budget remaining`
                          : budget === current
                          ? "Decrease another to make room"
                          : `Up to ${budget}% available`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {remaining > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs mt-2"
                  onClick={distributeRemaining}
                  data-testid="btn-distribute"
                >
                  Distribute remaining {remaining}% evenly
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Mobile total */}
          <div
            className={cn(
              "lg:hidden flex items-center justify-between rounded-xl border px-5 py-4 text-sm font-semibold",
              totalBg
            )}
            aria-live="polite"
            data-testid="total-indicator-mobile"
          >
            <span>Total allocated</span>
            <span className="text-lg font-display font-bold tabular-nums">{totalPercent}% / 100%</span>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-5">
            {/* Grid Score */}
            <Card className={cn("shadow-sm border-2 overflow-hidden", gridScore.bg)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                      Grid Score
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-6xl font-display font-black leading-none", gridScore.color)}>
                        {gridScore.grade}
                      </span>
                      <span className={cn("text-sm font-semibold", gridScore.color)}>
                        {gridScore.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60 mb-1">Score</p>
                    <p className={cn("text-3xl font-display font-bold tabular-nums", gridScore.color)}>
                      {gridScore.score}
                      <span className="text-base font-normal opacity-60">/100</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donut + stats */}
            <Card className="shadow-sm border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
                <h2 className="font-display font-bold text-lg">Your Grid</h2>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                    totalBg
                  )}
                  aria-live="polite"
                  data-testid="total-indicator"
                >
                  <span className="font-mono tabular-nums text-sm">{totalPercent}%</span>
                  <span className="opacity-60">/</span>
                  <span>100%</span>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="h-44 w-full" role="img" aria-label="Energy mix donut chart">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={2}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={300}
                        >
                          {chartData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [`${value}%`, "Share"]}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Move a slider to start
                    </div>
                  )}
                </div>

                {totalPercent === 100 && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2" role="status">
                    <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                    Grid fully allocated — ready to analyze
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-muted/40 rounded-xl border border-border cursor-help hover:bg-muted/60 transition-colors">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Renewables</p>
                        <p className={cn("text-2xl font-bold font-display",
                          stats.renewable > 30 ? "text-green-600" : stats.renewable >= 15 ? "text-amber-500" : "text-destructive"
                        )}>
                          {stats.renewable}%
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-48">
                      Share of electricity from wind, solar, and hydro. US average: 21%.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-muted/40 rounded-xl border border-border cursor-help hover:bg-muted/60 transition-colors">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CO₂ g/kWh</p>
                        <p className={cn("text-2xl font-bold font-display",
                          stats.co2 < 300 ? "text-green-600" : stats.co2 <= 450 ? "text-amber-500" : "text-destructive"
                        )}>
                          {stats.co2}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-48">
                      Grams of CO₂ released per kilowatt-hour generated. US average: 386 g/kWh.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-muted/40 rounded-xl border border-border cursor-help hover:bg-muted/60 transition-colors">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Price</p>
                        <p className="text-2xl font-bold font-display text-primary">{stats.price}¢</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-48">
                      Estimated electricity cost per kWh based on each source's relative cost. US average: 12.7¢.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {insights.length > 0 && (
              <Card className="shadow-sm border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Insights
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {insights.map((insight, i) => (
                      <li key={i} className="text-sm leading-relaxed text-foreground/80 flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* vs US Average */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  vs US Average
                </h3>
                <ComparisonRow label="Renewables" sim={stats.renewable} avg={US_AVERAGE.renewable} unit="%" higherIsBetter />
                <ComparisonRow label="CO₂ Intensity" sim={stats.co2} avg={US_AVERAGE.co2} unit="g" higherIsBetter={false} />
                <ComparisonRow label="Price" sim={parseFloat(stats.price)} avg={US_AVERAGE.price} unit="¢" higherIsBetter={false} />
              </CardContent>
            </Card>

            {/* Submit to Challenge */}
            {simTeam && (
              <Card className={cn("shadow-sm border-2 transition-all duration-300", simResult ? "border-teal-300 bg-teal-50" : "border-primary/25 bg-primary/5")}>
                <CardContent className="p-4 space-y-3">
                  {simResult ? (
                    <div className="text-center space-y-2 py-1">
                      <p className="text-2xl">🎉</p>
                      <p className="font-bold text-teal-700">+{simResult.points} points awarded to {simTeam.name}!</p>
                      {simResult.badge && (
                        <p className="text-sm font-semibold text-amber-600">🏆 Badge unlocked: {simResult.badge}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Design recorded in the community feed.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" aria-hidden="true" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submit to Challenge</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Share this grid design with <strong className="text-foreground">{simTeam.name}</strong> to earn <strong className="text-primary">+100 points</strong> and record your design in the community feed.
                        {totalPercent < 100 && <span className="block mt-1 text-amber-600 font-medium">Allocate all 100% to submit.</span>}
                      </p>
                      {gridScore.score >= 90 && totalPercent === 100 && (
                        <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          ⭐ Score ≥ 90 — you'll unlock the <strong>Master Grid Designer</strong> badge!
                        </p>
                      )}
                      <Button
                        className="w-full"
                        disabled={totalPercent < 100 || isSubmitting}
                        onClick={async () => {
                          try {
                            const result = await submitChallenge({
                              data: {
                                teamId: simTeam.id,
                                gridScore: gridScore.score,
                                renewablePercent: stats.renewable,
                                action: `a ${stats.renewable}% renewable grid scoring ${gridScore.grade} (${gridScore.score}/100)`,
                              },
                            });
                            setSimResult({ points: result.pointsAwarded, badge: result.unlockedBadge ?? null });
                            localStorage.setItem("challenge_sim_submitted", "true");
                          } catch { /* silent */ }
                        }}
                      >
                        <Trophy className="w-4 h-4 mr-2" aria-hidden="true" />
                        {isSubmitting ? "Submitting…" : `Submit Grid — Score ${gridScore.score}/100`}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label, sim, avg, unit, higherIsBetter,
}: {
  label: string; sim: number; avg: number; unit: string; higherIsBetter: boolean;
}) {
  const diff = sim - avg;
  const isBetter = higherIsBetter ? diff > 0 : diff < 0;
  const isSame = Math.abs(diff) < 0.5;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground line-through opacity-60 tabular-nums">{avg}{unit}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        <span className="font-semibold tabular-nums">{sim}{unit}</span>
        {!isSame && (
          <span
            className={cn(
              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums",
              isBetter ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}
            aria-label={`${Math.abs(diff).toFixed(1)} ${unit} ${isBetter ? "better" : "worse"} than average`}
          >
            {diff > 0 ? <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDown className="w-2.5 h-2.5 mr-0.5" />}
            {Math.abs(diff).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
