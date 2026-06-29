import { useGetEnergyAlerts, getGetEnergyAlertsQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";

export default function Alerts() {
  const { region } = useRegionStore();
  const { data: alerts, isLoading, isError, refetch } = useGetEnergyAlerts(
    { region },
    { query: { enabled: !!region, queryKey: getGetEnergyAlertsQueryKey({ region }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !alerts) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold tracking-tight">Grid Alerts</h1>
        <ErrorState
          title="Unable to load alerts"
          message="We couldn't fetch alerts for this region. Switch regions or try again."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold tracking-tight">Grid Alerts</h1>
        <p className="text-lg text-muted-foreground">
          Current warnings, issues, and what you can do to help.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display font-semibold mb-2">The grid is healthy</h3>
          <p className="text-muted-foreground">There are no active alerts or warnings for your region right now.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            
            return (
              <Card 
                key={alert.id} 
                className={cn(
                  "overflow-hidden border-l-4 shadow-sm",
                  isCritical ? "border-l-destructive bg-destructive/5" :
                  isWarning ? "border-l-accent bg-accent/5" :
                  "border-l-blue-500 bg-blue-500/5"
                )}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-full shrink-0",
                      isCritical ? "bg-destructive/20 text-destructive" :
                      isWarning ? "bg-accent/20 text-accent-foreground" :
                      "bg-blue-500/20 text-blue-600"
                    )}>
                      {isCritical ? <AlertOctagon className="w-6 h-6" /> : 
                       isWarning ? <AlertTriangle className="w-6 h-6" /> : 
                       <Info className="w-6 h-6" />}
                    </div>
                    
                    <div className="space-y-4 w-full">
                      <div>
                        <h3 className="text-2xl font-display font-bold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                          {alert.category} • Issued {new Date(alert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <p className="text-lg leading-relaxed text-foreground">
                        {alert.plainMessage}
                      </p>
                      
                      {alert.actionTip && (
                        <div className="mt-4 p-4 rounded-xl bg-background border border-border flex items-start gap-3">
                          <span className="font-semibold text-primary">Tip:</span>
                          <span className="text-foreground">{alert.actionTip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
