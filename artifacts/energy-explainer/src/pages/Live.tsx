import { useState, useEffect, useCallback } from "react";
import { useGetGenerationMix, getGetGenerationMixQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Clock, RefreshCw, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const REFETCH_INTERVAL = 60_000;

function useSecondsSince(timestampMs: number | undefined): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!timestampMs) return;
    const tick = () => setSeconds(Math.floor((Date.now() - timestampMs) / 1000));
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [timestampMs]);
  return seconds;
}

function calcHealthScore(renewablePct: number, co2: number, demandLevel: "normal" | "high" | "critical"): {
  score: number; label: string; color: string; bg: string; ring: string;
} {
  const renewableScore = Math.min(100, renewablePct * 1.2);
  const co2Score = Math.max(0, Math.min(100, ((600 - co2) / 600) * 100));
  const demandScore = demandLevel === "normal" ? 100 : demandLevel === "high" ? 60 : 20;
  const score = Math.round(renewableScore * 0.4 + co2Score * 0.4 + demandScore * 0.2);

  if (score >= 70) return { score, label: "Healthy", color: "text-green-700", bg: "bg-green-50", ring: "ring-green-400" };
  if (score >= 45) return { score, label: "Moderate", color: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-400" };
  return { score, label: "Stressed", color: "text-red-700", bg: "bg-red-50", ring: "ring-red-400" };
}

export default function Live() {
  const { region } = useRegionStore();
  const { data: mix, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useGetGenerationMix(
    { region },
    {
      query: {
        enabled: !!region,
        queryKey: getGetGenerationMixQueryKey({ region }),
        refetchInterval: REFETCH_INTERVAL,
      },
    }
  );

  const secondsSince = useSecondsSince(dataUpdatedAt);
  const [refreshing, setRefreshing] = useState(false);
const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await Promise.all([refetch(), new Promise((r) => setTimeout(r, 600))]);
  setRefreshing(false);
}, [refetch]);

  const freshLabel =
    secondsSince < 30
      ? "Just updated"
      : secondsSince < 90
      ? `${secondsSince}s ago`
      : `${Math.round(secondsSince / 60)}m ago`;

  if (isError && !mix) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-4xl font-display font-bold tracking-tight">Live Grid</h1>
        <Card className="border-border shadow-sm">
          <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-semibold text-lg mb-1">Unable to load grid data</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                We couldn't reach the data service. Your connection or the grid API may be temporarily unavailable.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || refreshing || !mix) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading live grid data">
        <Skeleton className="h-12 w-1/2 rounded-xl" />
        <Skeleton className="h-8 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const isNormal = mix.gridStatus === "normal";
  const isStressed = mix.gridStatus === "stressed";

  const renewableSources = mix.sources.filter((s) =>
    ["solar", "wind", "hydro", "other_renewables", "geothermal"].includes(s.source)
  );
  const renewablePct = renewableSources.reduce((sum, s) => sum + s.percent, 0);

  const demandLevel: "normal" | "high" | "critical" =
    mix.gridStatus === "critical" ? "critical" : mix.gridStatus === "stressed" ? "high" : "normal";

  const co2Estimate = Math.round(
    mix.sources.reduce((sum, s) => {
      const co2Map: Record<string, number> = {
        natural_gas: 490, coal: 820, nuclear: 12, wind: 11, solar: 45,
        hydro: 4, other_renewables: 18, petroleum: 650, imports: 260,
      };
      return sum + (co2Map[s.source] ?? 300) * (s.percent / 100);
    }, 0)
  );

  const health = calcHealthScore(renewablePct, co2Estimate, demandLevel);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display font-bold tracking-tight">Live Grid</h1>
            <div className="relative flex h-3 w-3" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" />
              As of {new Date(mix.asOf).toLocaleTimeString()}
            </span>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <span className="text-xs" aria-live="polite">
              {isFetching ? "Refreshing…" : `Updated ${freshLabel}`}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-xs cursor-help">
                  <Database className="w-3.5 h-3.5" aria-hidden="true" />
                  Estimated data
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-52">
                Grid data is based on EIA regional statistics. Real-time figures may vary.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Refresh grid data"
            className="gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
          <Badge
            variant={isNormal ? "default" : isStressed ? "secondary" : "destructive"}
            className="text-sm px-3 py-1.5 font-medium"
          >
            {mix.gridStatusLabel}
          </Badge>
        </div>
      </div>

      {/* Health Score + Overview row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className={cn("border-2 shadow-sm", health.bg, health.ring.replace("ring-", "border-"))}>
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={cn(
                "w-16 h-16 rounded-full ring-4 flex items-center justify-center flex-shrink-0",
                health.bg, health.ring
              )}
              role="meter"
              aria-valuenow={health.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Grid health score: ${health.score} out of 100`}
            >
              <span className={cn("text-2xl font-display font-black", health.color)}>
                {health.score}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Grid Health
              </p>
              <p className={cn("text-xl font-display font-bold", health.color)}>{health.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Based on renewables, CO₂ &amp; demand</p>
            </div>
          </CardContent>
        </Card>

        {/* Renewable share */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Clean Energy Now
            </p>
            <p className={cn(
              "text-4xl font-display font-bold",
              renewablePct > 40 ? "text-green-600" : renewablePct > 20 ? "text-amber-600" : "text-red-600"
            )}>
              {renewablePct.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              of current generation is clean
            </p>
          </CardContent>
        </Card>

        {/* CO₂ estimate */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Live CO₂ Intensity
            </p>
            <p className={cn(
              "text-4xl font-display font-bold",
              co2Estimate < 300 ? "text-green-600" : co2Estimate < 450 ? "text-amber-600" : "text-red-600"
            )}>
              {co2Estimate}
              <span className="text-lg font-normal text-muted-foreground ml-1">g/kWh</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              US avg: 386 g/kWh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status explanation */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-lg leading-relaxed">{mix.gridStatusExplanation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Source breakdown */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Output
            </h2>
            <span className="text-3xl font-display font-bold">
              {mix.totalMW.toLocaleString()} MW
            </span>
          </div>

          <div className="space-y-5">
            {mix.sources.map((source) => {
              const isClean = ["solar", "wind", "hydro", "other_renewables", "nuclear", "geothermal"].includes(source.source);
              return (
                <div key={source.source} className="space-y-1.5" role="listitem">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{source.label}</span>
                      {isClean && (
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">
                          clean
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {source.currentMW.toLocaleString()} MW
                      <span className="ml-2 font-semibold text-foreground">({source.percent}%)</span>
                    </span>
                  </div>
                  <div
                    className="h-4 w-full bg-muted rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={source.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${source.label}: ${source.percent}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${source.percent}%`,
                        backgroundColor: source.color ?? "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Auto-refresh notice */}
      <p className="text-xs text-muted-foreground text-center" aria-live="polite">
        Data refreshes automatically every 60 seconds.{" "}
        <button
          onClick={handleRefresh}
          className="underline underline-offset-2 hover:text-foreground transition-colors"
          aria-label="Manually refresh grid data now"
        >
          Refresh now
        </button>
      </p>
    </div>
  );
}
