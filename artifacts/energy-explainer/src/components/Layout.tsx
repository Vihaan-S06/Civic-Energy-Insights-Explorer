import { Link, useLocation } from "wouter";
import { Globe, Zap, Sun, AlertTriangle, TrendingUp, Activity, Users, Sliders, Trophy, Flame, Gamepad2, CalendarDays } from "lucide-react";
import { RegionSelector } from "./RegionSelector";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: Globe },
    { href: "/trends", label: "Trends", icon: TrendingUp },
    { href: "/sources", label: "Sources", icon: Sun },
    { href: "/live", label: "Live Grid", icon: Activity },
    { href: "/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/action", label: "Take Action", icon: Users },
    { href: "/simulate", label: "Simulator", icon: Sliders },
    { href: "/rankings", label: "Rankings", icon: Trophy },
    { href: "/challenge", label: "Challenge", icon: Flame },
    { href: "/game", label: "Play Game", icon: Gamepad2 },
    { href: "/events", label: "Events", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-display font-bold text-xl tracking-tight">
            <Zap className="w-6 h-6 fill-primary" />
            <span>Energy For Everyone</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted",
                    location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="h-6 w-px bg-border hidden md:block" />
            <RegionSelector />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>

      <footer className="border-t border-border bg-muted/30 py-12 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p className="font-display font-medium text-foreground mb-2">Energy For Everyone</p>
          <p>Public service meets modern civic tech. Understand your grid.</p>
        </div>
      </footer>
    </div>
  );
}
