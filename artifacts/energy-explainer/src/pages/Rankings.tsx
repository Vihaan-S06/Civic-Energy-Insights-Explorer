import { useGetRegionRankings, getGetRegionRankingsQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";

export default function Rankings() {
  const { region: selectedRegion } = useRegionStore();
  const { data, isLoading, isError, refetch } = useGetRegionRankings({ query: { queryKey: getGetRegionRankingsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold tracking-tight">Regional Rankings</h1>
        <ErrorState
          title="Unable to load rankings"
          message="We couldn't fetch the regional comparison data right now."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary">
          Regional Rankings
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          How does your region compare? See which states and grids lead — and which lag behind — on clean energy.
        </p>
      </div>

      <Tabs defaultValue="renewables" className="w-full">
        <TabsList className="w-full md:w-auto flex overflow-x-auto justify-start p-1 bg-muted/50 h-auto">
          <TabsTrigger value="renewables" className="px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md" data-testid="tab-renewables">Cleanest Energy</TabsTrigger>
          <TabsTrigger value="co2" className="px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md" data-testid="tab-co2">Lowest Carbon</TabsTrigger>
          <TabsTrigger value="price" className="px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md" data-testid="tab-price">Lowest Price</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="renewables" className="space-y-4 m-0">
            {data.byRenewables.map((entry, idx) => (
              <RankingRow 
                key={entry.region} 
                entry={entry} 
                metric={`${entry.renewablePercent}%`} 
                subText="Renewables"
                isSelected={entry.region === selectedRegion}
              />
            ))}
          </TabsContent>
          <TabsContent value="co2" className="space-y-4 m-0">
            {data.byCO2.map((entry, idx) => (
              <RankingRow 
                key={entry.region} 
                entry={entry} 
                metric={`${entry.co2IntensityGPerKWh}g`} 
                subText="CO₂ / kWh"
                isSelected={entry.region === selectedRegion}
              />
            ))}
          </TabsContent>
          <TabsContent value="price" className="space-y-4 m-0">
            {data.byPrice.map((entry, idx) => (
              <RankingRow 
                key={entry.region} 
                entry={entry} 
                metric={`${entry.averageRetailPriceCentsPerKWh}¢`} 
                subText="per kWh"
                isSelected={entry.region === selectedRegion}
              />
            ))}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function RankingRow({ entry, metric, subText, isSelected }: { entry: any, metric: string, subText: string, isSelected: boolean }) {
  const isTop3 = entry.rank <= 3;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 shadow-sm",
      isSelected ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border bg-card",
      isTop3 ? "scale-[1.01] shadow-md my-6 first:mt-2" : "opacity-90 hover:opacity-100"
    )}>
      <CardContent className="p-0 flex items-center min-h-[5rem]">
        <div className={cn(
          "w-16 md:w-24 h-full flex flex-col items-center justify-center border-r font-display font-bold text-2xl py-4",
          entry.rank === 1 ? "bg-amber-100 text-amber-600 border-amber-200" :
          entry.rank === 2 ? "bg-slate-100 text-slate-500 border-slate-200" :
          entry.rank === 3 ? "bg-orange-100 text-orange-700 border-orange-200" :
          "bg-muted/50 text-muted-foreground border-border"
        )}>
          #{entry.rank}
        </div>
        
        <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-lg">{entry.regionName}</h3>
              {isSelected && (
                <span className="flex items-center text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3 mr-1" /> You
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex gap-3 mt-1">
              <span>{entry.type === "national" ? "Country" : entry.type === "state" ? "State" : "Grid Operator"}</span>
              <span className="w-px bg-border"></span>
              <span>{entry.fossilPercent}% fossil</span>
            </p>
          </div>
          
          <div className="text-right flex md:flex-col items-end gap-2 md:gap-0">
            <span className="font-display font-bold text-2xl md:text-3xl tracking-tight text-foreground">{metric}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{subText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}