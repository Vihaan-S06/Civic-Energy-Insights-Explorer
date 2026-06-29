import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Leaf, TrendingDown, Car, Home, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  regionName: string;
  co2IntensityGPerKWh: number;
  averageRetailPriceCentsPerKWh: number;
  renewablePercent: number;
}

const US_AVG_CO2 = 386;
const US_AVG_KWH_PER_SQFT_YEAR = 8.4;
const CAR_MILES_PER_YEAR = 12000;
const CAR_CO2_PER_MILE_G = 400;
const CLEAN_GRID_CO2 = 50;

function formatLbs(kg: number) {
  const lbs = kg * 2.205;
  if (lbs >= 2000) return `${(lbs / 2000).toFixed(1)} tons`;
  return `${Math.round(lbs).toLocaleString()} lbs`;
}

function formatKg(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} metric tons`;
  return `${Math.round(kg)} kg`;
}

export function ImpactCalculator({ regionName, co2IntensityGPerKWh, averageRetailPriceCentsPerKWh, renewablePercent }: Props) {
  const [homeSqFt, setHomeSqFt] = useState("1500");
  const [monthlyBill, setMonthlyBill] = useState("");
  const [hasEV, setHasEV] = useState(false);
  const [evMilesPerYear, setEvMilesPerYear] = useState("12000");
  const [calculated, setCalculated] = useState(false);

  const results = useMemo(() => {
    const sqft = parseFloat(homeSqFt) || 0;
    const bill = parseFloat(monthlyBill);
    const evMiles = parseFloat(evMilesPerYear) || CAR_MILES_PER_YEAR;

    const estimatedKwhPerYear = bill
      ? (bill / (averageRetailPriceCentsPerKWh / 100)) * 12
      : sqft * US_AVG_KWH_PER_SQFT_YEAR;

    const annualCostDollars = bill
      ? bill * 12
      : (estimatedKwhPerYear * averageRetailPriceCentsPerKWh) / 100;

    const homeCo2KgPerYear = (estimatedKwhPerYear * co2IntensityGPerKWh) / 1000;
    const evCo2KgPerYear = hasEV ? (evMiles * (co2IntensityGPerKWh / 1000) * 0.3) : 0;
    const totalCo2KgPerYear = homeCo2KgPerYear + evCo2KgPerYear;

    const usAvgHomeCo2 = (estimatedKwhPerYear * US_AVG_CO2) / 1000;
    const vsUsAvgKg = usAvgHomeCo2 - homeCo2KgPerYear;

    const cleanGridHomeCo2 = (estimatedKwhPerYear * CLEAN_GRID_CO2) / 1000;
    const cleanGridEvCo2 = hasEV ? (evMiles * (CLEAN_GRID_CO2 / 1000) * 0.3) : 0;
    const cleanGridSavingsKg = totalCo2KgPerYear - (cleanGridHomeCo2 + cleanGridEvCo2);

    const carEquivMiles = Math.round((totalCo2KgPerYear * 1000) / CAR_CO2_PER_MILE_G);
    const treesNeeded = Math.ceil(totalCo2KgPerYear / 21);

    const isNationalAvg = Math.abs(co2IntensityGPerKWh - US_AVG_CO2) <= 2;
    const gridCleanerThanUs = co2IntensityGPerKWh < US_AVG_CO2;
    const emissionsVsUs = Math.abs(Math.round(((co2IntensityGPerKWh - US_AVG_CO2) / US_AVG_CO2) * 100));

    return {
      estimatedKwhPerYear: Math.round(estimatedKwhPerYear),
      annualCostDollars: Math.round(annualCostDollars),
      homeCo2KgPerYear: Math.round(homeCo2KgPerYear),
      totalCo2KgPerYear: Math.round(totalCo2KgPerYear),
      vsUsAvgKg: Math.round(vsUsAvgKg),
      cleanGridSavingsKg: Math.round(cleanGridSavingsKg),
      carEquivMiles,
      treesNeeded,
      isNationalAvg,
      gridCleanerThanUs,
      emissionsVsUs,
    };
  }, [homeSqFt, monthlyBill, hasEV, evMilesPerYear, co2IntensityGPerKWh, averageRetailPriceCentsPerKWh]);

  const isValid = (parseFloat(homeSqFt) > 0) || (parseFloat(monthlyBill) > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Your Personal Energy Impact
        </h2>
        <p className="text-muted-foreground">See your estimated electricity footprint and what a cleaner grid would mean for you.</p>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display">Tell us about your home</CardTitle>
          <CardDescription>We'll estimate your usage based on {regionName}'s grid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sqft" className="flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                Home size (sq ft)
              </Label>
              <Input
                id="sqft"
                type="number"
                min="100"
                max="10000"
                placeholder="1500"
                value={homeSqFt}
                onChange={e => setHomeSqFt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Monthly electric bill (optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="bill"
                  type="number"
                  min="0"
                  placeholder={`e.g. ${Math.round((parseFloat(homeSqFt) || 1500) * US_AVG_KWH_PER_SQFT_YEAR * averageRetailPriceCentsPerKWh / 1200)}`}
                  value={monthlyBill}
                  onChange={e => setMonthlyBill(e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">Overrides home size estimate if provided</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              Do you own an electric vehicle?
            </Label>
            <div className="flex gap-3">
              <button
                onClick={() => setHasEV(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                  !hasEV
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                No EV
              </button>
              <button
                onClick={() => setHasEV(true)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                  hasEV
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                Yes, I have an EV
              </button>
            </div>
            {hasEV && (
              <div className="space-y-2 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="evmiles">Miles driven per year</Label>
                <Input
                  id="evmiles"
                  type="number"
                  min="0"
                  max="100000"
                  placeholder="12000"
                  value={evMilesPerYear}
                  onChange={e => setEvMilesPerYear(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
            )}
          </div>

          <Button
            onClick={() => setCalculated(true)}
            disabled={!isValid}
            className="w-full sm:w-auto"
            size="lg"
          >
            Calculate My Impact
          </Button>
        </CardContent>
      </Card>

      {calculated && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm border-border bg-amber-50 border-amber-200">
              <CardContent className="pt-6 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">Annual Usage</p>
                <p className="text-3xl font-display font-bold text-amber-900">
                  {results.estimatedKwhPerYear.toLocaleString()}
                  <span className="text-base font-normal ml-1">kWh</span>
                </p>
                <p className="text-sm text-amber-700 mt-1">≈ ${results.annualCostDollars.toLocaleString()}/yr at local rates</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-red-50 border-red-200">
              <CardContent className="pt-6 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-1">Your CO₂ Footprint</p>
                <p className="text-3xl font-display font-bold text-red-900">
                  {formatKg(results.totalCo2KgPerYear)}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Like driving {results.carEquivMiles.toLocaleString()} miles in a gas car
                </p>
              </CardContent>
            </Card>

            {results.isNationalAvg ? (
              <Card className="shadow-sm border bg-slate-50 border-slate-200">
                <CardContent className="pt-6 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Grid Benchmark</p>
                  <p className="text-3xl font-display font-bold text-slate-800">US Baseline</p>
                  <p className="text-sm text-slate-600 mt-1">
                    This is the national average — all regional comparisons are measured against it.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className={cn(
                "shadow-sm border",
                results.gridCleanerThanUs
                  ? "bg-teal-50 border-teal-200"
                  : "bg-orange-50 border-orange-200"
              )}>
                <CardContent className="pt-6 pb-5">
                  <p className={cn(
                    "text-xs font-semibold uppercase tracking-wider mb-1",
                    results.gridCleanerThanUs ? "text-teal-700" : "text-orange-700"
                  )}>
                    vs US Average
                  </p>
                  <p className={cn(
                    "text-3xl font-display font-bold",
                    results.gridCleanerThanUs ? "text-teal-900" : "text-orange-900"
                  )}>
                    {results.gridCleanerThanUs ? "−" : "+"}{results.emissionsVsUs}%
                  </p>
                  <p className={cn(
                    "text-sm mt-1",
                    results.gridCleanerThanUs ? "text-teal-700" : "text-orange-700"
                  )}>
                    {results.gridCleanerThanUs
                      ? `${regionName}'s grid is cleaner than the US average`
                      : `${regionName}'s grid is dirtier than the US average`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="shadow-sm border-border bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-100 rounded-full shrink-0">
                  <Leaf className="w-6 h-6 text-teal-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">If The Grid Went 100% Clean</p>
                  <p className="text-2xl font-display font-bold text-teal-900">
                    You'd save {formatLbs(results.cleanGridSavingsKg)} of CO₂ per year
                  </p>
                  <p className="text-teal-700 text-sm leading-relaxed mt-1">
                    That's equivalent to planting <strong>{results.treesNeeded.toLocaleString()} trees</strong> — without changing anything about how you live.
                    {renewablePercent > 0 && (
                      <> {regionName} is already at <strong>{renewablePercent}% renewable</strong> — every percentage point gained gets you closer.</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Educational estimates — not a utility-grade carbon calculator
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Results are reasonable approximations based on regional grid characteristics, not your actual meter data.
              For a precise footprint, use your utility's bill history or the{" "}
              <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">EPA's Greenhouse Gas Equivalencies Calculator</a>.
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Grid CO₂ intensity: {co2IntensityGPerKWh} g/kWh ({regionName}, EIA-based estimate)</li>
              <li>Retail electricity rate: {averageRetailPriceCentsPerKWh}¢/kWh (EIA state average)</li>
              <li>Home usage model: {US_AVG_KWH_PER_SQFT_YEAR} kWh/sq ft/year (EIA RECS survey average)</li>
              <li>EV efficiency: 0.3 kWh/mile (EPA mid-range for BEVs)</li>
              <li>Vehicle emissions: 400 g CO₂/mile for gas cars (EPA average)</li>
              <li>Tree sequestration: ~21 kg CO₂/tree/year (US Forest Service estimate)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
