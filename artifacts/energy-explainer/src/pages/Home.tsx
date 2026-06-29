import { useGetEnergyOverview, getGetEnergyOverviewQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudRain, Leaf, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ErrorState } from "@/components/ErrorState";

export default function Home() {
  const { region } = useRegionStore();
  const { data: overview, isLoading, isError, refetch } = useGetEnergyOverview(
    { region },
    { query: { enabled: !!region, queryKey: getGetEnergyOverviewQueryKey({ region }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <ErrorState
        title="Unable to load grid overview"
        message="We couldn't fetch energy data for this region. Try switching regions or refreshing."
        onRetry={() => void refetch()}
      />
    );
  }

  const mixData = [
    { name: "Renewables", value: overview.renewablePercent, color: "hsl(var(--chart-1))" },
    { name: "Fossil Fuels", value: overview.fossilPercent, color: "hsl(var(--chart-4))" },
    { name: "Nuclear", value: overview.nuclearPercent, color: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary">
          {overview.headline}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {overview.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <Card className="md:col-span-8 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">The Big Picture</CardTitle>
            <CardDescription>Generation mix for {overview.regionName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => [`${value}%`, 'Share']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 space-y-6">
              {mixData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-xl font-bold font-display">{item.value}%</span>
                </div>
              ))}
              
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Total Generation: <span className="font-semibold text-foreground">{overview.totalGenerationGWh.toLocaleString()} GWh</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renewable Growth</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-display font-bold mt-1">
                    {overview.trendVsLastYear !== null && overview.trendVsLastYear !== undefined && overview.trendVsLastYear > 0 ? '+' : ''}
                    {overview.trendVsLastYear}%
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs same period last year</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-muted text-muted-foreground rounded-xl">
                <CloudRain className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CO₂ Intensity</p>
                <h3 className="text-3xl font-display font-bold mt-1">
                  {overview.co2IntensityGPerKWh}g
                </h3>
                <p className="text-xs text-muted-foreground mt-1">per kWh generated</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-accent/20 text-accent-foreground rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Retail Price</p>
                <h3 className="text-3xl font-display font-bold mt-1">
                  {overview.averageRetailPriceCentsPerKWh}¢
                </h3>
                <p className="text-xs text-muted-foreground mt-1">per kWh for consumers</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
