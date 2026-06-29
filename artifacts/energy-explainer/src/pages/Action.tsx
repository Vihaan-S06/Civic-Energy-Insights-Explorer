import { useState, useEffect } from "react";
import { useGetRecommendations, getGetRecommendationsQueryKey, useGetEnergyOverview, getGetEnergyOverviewQueryKey } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sun, Zap, Users, Shield, Lightbulb, Activity, Check, Copy, ArrowRight, MessageSquare } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { ImpactCalculator } from "@/components/ImpactCalculator";
import { cn } from "@/lib/utils";

const IconMap: Record<string, React.ElementType> = {
  Sun: Sun,
  Zap: Zap,
  Users: Users,
  Shield: Shield,
  Lightbulb: Lightbulb,
  Activity: Activity,
  Mail: MessageSquare,
};

const categoryColors: Record<string, string> = {
  solar: "bg-amber-100 text-amber-800 border-amber-200",
  efficiency: "bg-teal-100 text-teal-800 border-teal-200",
  advocacy: "bg-blue-100 text-blue-800 border-blue-200",
  policy: "bg-purple-100 text-purple-800 border-purple-200",
  community: "bg-green-100 text-green-800 border-green-200",
  grid: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function Action() {
  const { region } = useRegionStore();
  
  const { data, isLoading, isError, refetch } = useGetRecommendations(
    { region },
    { query: { enabled: !!region, queryKey: getGetRecommendationsQueryKey({ region }) } }
  );

  const { data: overview } = useGetEnergyOverview(
    { region },
    { query: { enabled: !!region, queryKey: getGetEnergyOverviewQueryKey({ region }) } }
  );

  const [activeTab, setActiveTab] = useState<string>("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.emailTemplates?.length && !activeTab) {
      setActiveTab(data.emailTemplates[0].recipient);
    }
  }, [data, activeTab]);

  useEffect(() => {
    if (data?.emailTemplates) {
      const template = data.emailTemplates.find(t => t.recipient === activeTab) || data.emailTemplates[0];
      if (template) {
        let text = template.body;
        if (name) text = text.replace("[Your Name]", name);
        if (city) text = text.replace("[Your City, State]", city).replace("[Your City]", city);
        setCustomBody(text);
      }
    }
  }, [activeTab, name, city, data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold tracking-tight">Take Action</h1>
        <ErrorState
          title="Unable to load recommendations"
          message="We couldn't fetch personalized action items for this region."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const activeTemplate = data.emailTemplates?.find(t => t.recipient === activeTab) || data.emailTemplates?.[0];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary">
          Take Action
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          What you can do in {data.regionName} right now.
        </p>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
        <div className="p-4 bg-destructive/20 rounded-full text-destructive">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-destructive mb-2">{data.topIssue}</h2>
          <p className="text-destructive/80 text-lg leading-relaxed">{data.topIssueExplanation}</p>
        </div>
      </div>

      {overview && (
        <div className="pt-2 pb-4 border-b border-border">
          <ImpactCalculator
            regionName={overview.regionName ?? data.regionName}
            co2IntensityGPerKWh={overview.co2IntensityGPerKWh ?? 386}
            averageRetailPriceCentsPerKWh={overview.averageRetailPriceCentsPerKWh ?? 12.7}
            renewablePercent={overview.renewablePercent ?? 21.5}
          />
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Recommended Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.recommendations.map(rec => {
            const Icon = IconMap[rec.icon] || Zap;
            return (
              <Card key={rec.id} className="shadow-sm border-border overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border", categoryColors[rec.category] || categoryColors.grid)}>
                      {rec.category}
                    </div>
                  </div>
                  <CardTitle className="font-display text-xl flex items-center gap-2 mt-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground">{rec.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {data.emailTemplates && data.emailTemplates.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-border">
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Contact Your Officials</h2>
            <p className="text-muted-foreground">Use these ready-to-send email templates — personalized to your region.</p>
          </div>

          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/30 border-b border-border">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start h-auto flex-wrap p-1 gap-1 bg-transparent">
                  {data.emailTemplates.map(t => (
                    <TabsTrigger 
                      key={t.recipient} 
                      value={t.recipient}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2"
                      data-testid={`tab-${t.recipient}`}
                    >
                      {t.recipient}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Jane Doe" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Your City</Label>
                  <Input 
                    id="city" 
                    placeholder="Austin, TX" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    data-testid="input-city"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Body</Label>
                </div>
                <Textarea 
                  className="min-h-[250px] font-mono text-sm resize-y leading-relaxed" 
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  data-testid="textarea-email"
                />
              </div>

              {activeTemplate && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50 p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-2">Subject:</span>
                    {activeTemplate.subject}
                  </p>
                  <Button onClick={handleCopy} className="w-full sm:w-auto" variant={copied ? "default" : "default"} data-testid="btn-copy">
                    {copied ? (
                      <><Check className="w-4 h-4 mr-2" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Copy Email</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}