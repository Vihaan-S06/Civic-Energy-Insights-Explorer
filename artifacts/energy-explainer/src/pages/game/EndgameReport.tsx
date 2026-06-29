import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StateData, calcGridStats, EnergySourceId, GameState } from "./gameData";
import { RotateCcw, Share2, Leaf, DollarSign, Shield, ThumbsUp, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface EndgameReportProps {
  state: GameState;
  onRestart: () => void;
}

const GRADE_STYLES: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-50 border-emerald-300",
  A: "text-emerald-600 bg-emerald-50 border-emerald-300",
  B: "text-blue-600 bg-blue-50 border-blue-300",
  C: "text-amber-600 bg-amber-50 border-amber-300",
  D: "text-orange-600 bg-orange-50 border-orange-300",
  F: "text-red-600 bg-red-50 border-red-300",
};

const GRADE_MESSAGES: Record<string, string> = {
  "A+": "Outstanding! You've built one of the cleanest, most reliable grids in the nation.",
  A: "Excellent work. Your grid balances clean energy, affordability, and reliability beautifully.",
  B: "Good job. Your grid performs above average — a few more investments could push it higher.",
  C: "Decent start, but there's real room for improvement. Emissions and reliability need attention.",
  D: "Your grid is struggling. Residents are feeling the effects in their bills and outage frequency.",
  F: "The grid is in crisis. Rolling blackouts, high emissions, and public frustration are mounting.",
};

function scoreToGrade(score: number): string {
  if (score >= 92) return "A+";
  if (score >= 82) return "A";
  if (score >= 70) return "B";
  if (score >= 58) return "C";
  if (score >= 46) return "D";
  return "F";
}

export function EndgameReport({ state, onRestart }: EndgameReportProps) {
  const { region, mix, reliability, blackoutCount, yearHistory, budgetSpent, budget } = state;
  if (!region) return null;

  const finalStats = calcGridStats(mix);
  const startStats = yearHistory[0]?.stats;

  const co2Change = startStats ? Math.round(finalStats.co2 - startStats.co2) : 0;
  const priceChange = startStats ? +(finalStats.price - startStats.price).toFixed(1) : 0;
  const renewChange = startStats ? Math.round(finalStats.renewablePct - startStats.renewablePct) : 0;

  const dimensions: Array<{
    label: string;
    score: number;
    icon: React.ReactNode;
    detail: string;
    color: string;
  }> = [
    {
      label: "Clean Energy",
      score: finalStats.renewScore,
      icon: <Leaf className="w-4 h-4" />,
      detail: `${Math.round(finalStats.renewablePct)}% renewable`,
      color: "emerald",
    },
    {
      label: "CO₂ Reduction",
      score: finalStats.co2Score,
      icon: <Zap className="w-4 h-4" />,
      detail: `${Math.round(finalStats.co2)}g/kWh`,
      color: "green",
    },
    {
      label: "Affordability",
      score: finalStats.priceScore,
      icon: <DollarSign className="w-4 h-4" />,
      detail: `${finalStats.price.toFixed(1)}¢/kWh`,
      color: "blue",
    },
    {
      label: "Reliability",
      score: Math.round(reliability),
      icon: <Shield className="w-4 h-4" />,
      detail: `${blackoutCount} blackout${blackoutCount !== 1 ? "s" : ""}`,
      color: "violet",
    },
    {
      label: "Public Approval",
      score: Math.round(finalStats.approval),
      icon: <ThumbsUp className="w-4 h-4" />,
      detail: `${Math.round(finalStats.approval)}% support`,
      color: "amber",
    },
    {
      label: "Budget Performance",
      score: Math.max(0, Math.min(100, Math.round(100 - (budgetSpent / budget) * 100))),
      icon: <Trophy className="w-4 h-4" />,
      detail: `$${(budget - budgetSpent).toFixed(1)}B remaining`,
      color: "rose",
    },
  ];

  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
  const overallGrade = scoreToGrade(overallScore);

  const shareText = `I ran ${region.name}'s electric grid and got a ${overallGrade} (${overallScore}/100) on Energy For Everyone! Can you do better?`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert("Result copied to clipboard!"));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-5xl mb-2">📋</div>
        <h1 className="text-3xl font-black">Final Grid Report</h1>
        <p className="text-muted-foreground">
          {region.name} Energy Director · 2026–2030
        </p>

        <div className="inline-flex flex-col items-center gap-1">
          <div
            className={cn(
              "text-7xl font-black border-4 rounded-2xl px-8 py-4",
              GRADE_STYLES[overallGrade]
            )}
          >
            {overallGrade}
          </div>
          <div className="text-sm text-muted-foreground">{overallScore} / 100</div>
        </div>

        <p className="text-base font-medium max-w-md mx-auto leading-relaxed">
          {GRADE_MESSAGES[overallGrade]}
        </p>
      </div>

      {/* Dimension scores */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold text-lg mb-4">Performance Breakdown</h2>
        <div className="space-y-4">
          {dimensions.map((dim) => {
            const grade = scoreToGrade(dim.score);
            return (
              <div key={dim.label} className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-sm font-medium shrink-0">
                  <span className="text-muted-foreground">{dim.icon}</span>
                  {dim.label}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${Math.min(100, dim.score)}%` }}
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold w-10 justify-center", GRADE_STYLES[grade])}
                    >
                      {grade}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{dim.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Changes from baseline */}
      {startStats && (
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-bold text-lg mb-4">Changes from 2026 Baseline</h2>
          <div className="grid grid-cols-3 gap-4">
            <ChangeCard
              label="CO₂ Intensity"
              value={co2Change}
              unit="g/kWh"
              lowerIsBetter
            />
            <ChangeCard
              label="Electricity Price"
              value={priceChange}
              unit="¢/kWh"
              lowerIsBetter
            />
            <ChangeCard
              label="Renewables"
              value={renewChange}
              unit="%"
              lowerIsBetter={false}
            />
          </div>
        </div>
      )}

      {/* Compare to real world */}
      <div className="rounded-2xl border bg-muted/40 p-5">
        <h2 className="font-semibold mb-3">How Does It Compare?</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Real {region.name} (2026)</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Renewables</span>
                <span className="font-semibold">{region.renewablePct}%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg price</span>
                <span className="font-semibold">{region.avgPriceCents}¢</span>
              </div>
              <div className="flex justify-between">
                <span>CO₂</span>
                <span className="font-semibold">{region.co2Intensity}g/kWh</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Your 2030 Grid</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Renewables</span>
                <span className={cn("font-semibold", finalStats.renewablePct > region.renewablePct ? "text-emerald-600" : "text-red-500")}>
                  {Math.round(finalStats.renewablePct)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg price</span>
                <span className={cn("font-semibold", finalStats.price < region.avgPriceCents ? "text-emerald-600" : "text-red-500")}>
                  {finalStats.price.toFixed(1)}¢
                </span>
              </div>
              <div className="flex justify-between">
                <span>CO₂</span>
                <span className={cn("font-semibold", finalStats.co2 < region.co2Intensity ? "text-emerald-600" : "text-red-500")}>
                  {Math.round(finalStats.co2)}g/kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pb-4">
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> Share Result
        </Button>
        <Button onClick={onRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Play Again
        </Button>
      </div>
    </div>
  );
}

function ChangeCard({
  label,
  value,
  unit,
  lowerIsBetter,
}: {
  label: string;
  value: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  const improved = lowerIsBetter ? value < 0 : value > 0;
  const unchanged = value === 0;
  return (
    <div className="rounded-xl border bg-background p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          "text-xl font-bold",
          unchanged ? "text-foreground" : improved ? "text-emerald-600" : "text-red-500"
        )}
      >
        {value > 0 ? "+" : ""}
        {value}
        {unit}
      </div>
      <div className="text-xs mt-0.5 text-muted-foreground">
        {unchanged ? "unchanged" : improved ? "improved" : "worsened"}
      </div>
    </div>
  );
}
