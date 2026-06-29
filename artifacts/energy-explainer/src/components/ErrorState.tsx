import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4 rounded-full bg-muted">
        <AlertCircle className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="font-semibold text-lg">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
