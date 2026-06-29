import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetRegions } from "@workspace/api-client-react";
import { useRegionStore } from "@/hooks/use-region";
import { Skeleton } from "@/components/ui/skeleton";

export function RegionSelector() {
  const { data: regions, isLoading } = useGetRegions();
  const { region, setRegion } = useRegionStore();

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  return (
    <Select value={region} onValueChange={setRegion}>
      <SelectTrigger className="w-[240px] bg-background border-border shadow-sm">
        <SelectValue placeholder="Select a region" />
      </SelectTrigger>
      <SelectContent>
        {regions?.map((r) => (
          <SelectItem key={r.code} value={r.code}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
