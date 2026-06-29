import { useGetEnergyBySource, getGetEnergyBySourceQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ErrorState";

export default function Sources() {
  const { region } = useRegionStore();
  const { data: sources, isLoading, isError, refetch } = useGetEnergyBySource(
    { region },
    { query: { enabled: !!region, queryKey: getGetEnergyBySourceQueryKey({ region }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <Skeleton className="h-12 w-1/2 rounded-xl" />
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !sources) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold tracking-tight">Where It Comes From</h1>
        <ErrorState
          title="Unable to load energy sources"
          message="We couldn't fetch the generation mix for this region. Try again or switch regions."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  // Sort by percent descending
  const sortedSources = [...sources].sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold tracking-tight">Where It Comes From</h1>
        <p className="text-lg text-muted-foreground">
          Understanding the individual puzzle pieces that make up our grid.
        </p>
      </div>

      <div className="grid gap-6">
        {sortedSources.map((source) => (
          <Card key={source.source} className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row">
              <div 
                className="w-full md:w-48 p-6 flex flex-col justify-center text-white"
                style={{ backgroundColor: source.color || 'hsl(var(--primary))' }}
              >
                <h3 className="font-display text-2xl font-bold">{source.label}</h3>
                <div className="text-4xl font-black mt-2">{source.percent}%</div>
                <div className="text-sm opacity-80 mt-1">{source.generationGWh.toLocaleString()} GWh</div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {source.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    CO₂ Intensity: <strong className="text-foreground">{source.co2GPerKWh}g/kWh</strong>
                  </span>
                </div>
                <p className="text-lg text-foreground leading-relaxed">
                  {source.plainDescription}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
