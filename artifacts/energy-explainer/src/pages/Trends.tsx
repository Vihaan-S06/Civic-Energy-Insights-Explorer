import { useGetEnergyTrends, getGetEnergyTrendsQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ErrorState } from "@/components/ErrorState";

export default function Trends() {
  const { region } = useRegionStore();
  const { data: trends, isLoading, isError, refetch } = useGetEnergyTrends(
    { region, metric: "renewables" },
    { query: { enabled: !!region, queryKey: getGetEnergyTrendsQueryKey({ region, metric: "renewables" }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !trends) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold tracking-tight">Trends &amp; History</h1>
        <ErrorState
          title="Unable to load trend data"
          message="We couldn't fetch the 12-month history for this region."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold tracking-tight">Trends & History</h1>
        <p className="text-lg text-muted-foreground">
          See how the grid has shifted over the last 12 months.
        </p>
      </div>

      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border pb-6">
          <CardTitle className="font-display text-xl">Renewable Energy Growth</CardTitle>
          <CardDescription className="text-base mt-2">
            The percentage of power coming from renewable sources over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRenewable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Renewables']}
                />
                <Area 
                  type="monotone" 
                  dataKey="renewablePercent" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRenewable)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
