import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/Layout";

const Home = lazy(() => import("@/pages/Home"));
const Trends = lazy(() => import("@/pages/Trends"));
const Sources = lazy(() => import("@/pages/Sources"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const Live = lazy(() => import("@/pages/Live"));
const Action = lazy(() => import("@/pages/Action"));
const Simulate = lazy(() => import("@/pages/Simulate"));
const Rankings = lazy(() => import("@/pages/Rankings"));
const Challenge = lazy(() => import("@/pages/Challenge"));
const Game = lazy(() => import("@/pages/Game"));
const Events = lazy(() => import("@/pages/Events"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-12 w-1/2 rounded-xl" />
      <Skeleton className="h-6 w-2/3 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/trends" component={Trends} />
          <Route path="/sources" component={Sources} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/live" component={Live} />
          <Route path="/action" component={Action} />
          <Route path="/simulate" component={Simulate} />
          <Route path="/rankings" component={Rankings} />
          <Route path="/challenge" component={Challenge} />
          <Route path="/game" component={Game} />
          <Route path="/events" component={Events} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
