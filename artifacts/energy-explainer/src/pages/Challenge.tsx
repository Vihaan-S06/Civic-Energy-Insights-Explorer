import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useGetChallengeStats, getGetChallengeStatsQueryKey,
  useGetChallengeLeaderboard, getGetChallengeLeaderboardQueryKey,
  useGetCurrentCampaign, getGetCurrentCampaignQueryKey,
  useGetChallengeFeed, getGetChallengeFeedQueryKey,
  useCreateChallengeTeam,
  useJoinChallengeTeam,
  useSubmitChallengePledge,
} from "@workspace/api-client-react";
import type { ChallengeTeam, LeaderboardEntry, CurrentCampaign, FeedItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Users, Leaf, Zap, Award, Plus, LogIn,
  Activity, Clock, ChevronDown, ChevronUp, Flame, Target,
  BookOpen, Car, Home, Sun, Info, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";
type MissionCategory = "Daily Habits" | "Home Efficiency" | "Transportation" | "Renewables" | "Community" | "Learning";

interface Mission {
  id: string;
  name: string;
  emoji: string;
  category: MissionCategory;
  difficulty: Difficulty;
  timeLabel: string;
  savingsPerYear: number;
  co2LbsPerYear: number;
  co2KgSaved: number;
  points: number;
  whyItMatters: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_TYPES = ["School", "Neighborhood", "Scout Troop", "Club", "Community Group", "Other"] as const;

const DIFFICULTY_POINTS: Record<Difficulty, number> = { Easy: 50, Medium: 100, Hard: 250, Expert: 500 };

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-orange-100 text-orange-700 border-orange-200",
  Expert: "bg-red-100 text-red-700 border-red-200",
};

const CATEGORY_ICONS: Record<MissionCategory, React.ReactNode> = {
  "Daily Habits": <Zap className="w-4 h-4" />,
  "Home Efficiency": <Home className="w-4 h-4" />,
  "Transportation": <Car className="w-4 h-4" />,
  "Renewables": <Sun className="w-4 h-4" />,
  "Community": <Users className="w-4 h-4" />,
  "Learning": <BookOpen className="w-4 h-4" />,
};

const ALL_MISSIONS: Mission[] = [
  // ── Daily Habits ──
  { id: "dh-lights", name: "Turn off lights when leaving", emoji: "💡", category: "Daily Habits", difficulty: "Easy", timeLabel: "0 min", savingsPerYear: 12, co2LbsPerYear: 110, co2KgSaved: 50, points: 50, whyItMatters: "Lighting accounts for about 15% of home electricity. Turning off lights whenever you leave a room is one of the simplest habits that adds up over time." },
  { id: "dh-dishwasher", name: "Run dishwasher overnight (off-peak)", emoji: "🍽️", category: "Daily Habits", difficulty: "Easy", timeLabel: "1 min", savingsPerYear: 10, co2LbsPerYear: 88, co2KgSaved: 40, points: 50, whyItMatters: "Running appliances overnight (9 PM–7 AM) reduces strain on the grid during peak hours and often uses cleaner energy when wind generation is highest." },
  { id: "dh-coldwash", name: "Wash clothes with cold water", emoji: "🧺", category: "Daily Habits", difficulty: "Easy", timeLabel: "0 min", savingsPerYear: 30, co2LbsPerYear: 264, co2KgSaved: 120, points: 50, whyItMatters: "About 90% of washing machine energy goes toward heating water. Cold water works just as well for most laundry — it's one of the easiest swaps available." },
  { id: "dh-unplug", name: "Unplug idle chargers and electronics", emoji: "🔌", category: "Daily Habits", difficulty: "Easy", timeLabel: "3 min", savingsPerYear: 20, co2LbsPerYear: 198, co2KgSaved: 90, points: 50, whyItMatters: "Idle electronics in standby mode — TVs, game consoles, phone chargers — consume up to 10% of residential electricity. This invisible drain is called phantom load." },
  { id: "dh-shower", name: "Take a 5-minute shorter shower", emoji: "🚿", category: "Daily Habits", difficulty: "Easy", timeLabel: "0 min", savingsPerYear: 22, co2LbsPerYear: 132, co2KgSaved: 60, points: 50, whyItMatters: "Water heating is typically a home's second-largest energy expense. Shaving 5 minutes off daily showers saves significant energy and water every year." },
  { id: "dh-airdry", name: "Air dry laundry instead of using the dryer", emoji: "👕", category: "Daily Habits", difficulty: "Medium", timeLabel: "5 min", savingsPerYear: 50, co2LbsPerYear: 220, co2KgSaved: 100, points: 100, whyItMatters: "Clothes dryers are one of the most energy-intensive household appliances. Air drying just one load per week saves over 20 lbs of CO₂ per month." },
  { id: "dh-cartrip", name: "Skip one car trip and walk or bike", emoji: "🚶", category: "Daily Habits", difficulty: "Medium", timeLabel: "varies", savingsPerYear: 60, co2LbsPerYear: 396, co2KgSaved: 180, points: 100, whyItMatters: "The average American car emits about 404 grams of CO₂ per mile. Replacing even one short trip per week adds up to hundreds of pounds saved per year." },

  // ── Home Efficiency ──
  { id: "he-led", name: "Replace one incandescent bulb with LED", emoji: "💡", category: "Home Efficiency", difficulty: "Easy", timeLabel: "10 min", savingsPerYear: 35, co2LbsPerYear: 85, co2KgSaved: 38, points: 50, whyItMatters: "LED bulbs use approximately 75% less energy than incandescents and last 15–25× longer. Replacing a single bulb keeps about 85 lbs of CO₂ out of the atmosphere each year." },
  { id: "he-therm", name: "Adjust thermostat by 2°F seasonally", emoji: "🌡️", category: "Home Efficiency", difficulty: "Easy", timeLabel: "2 min", savingsPerYear: 90, co2LbsPerYear: 352, co2KgSaved: 160, points: 50, whyItMatters: "Heating and cooling account for nearly 48% of home energy use. A 2°F adjustment saves energy year-round and is one of the highest-impact small changes you can make." },
  { id: "he-strip", name: "Install a smart power strip", emoji: "🔌", category: "Home Efficiency", difficulty: "Medium", timeLabel: "15 min", savingsPerYear: 30, co2LbsPerYear: 198, co2KgSaved: 90, points: 100, whyItMatters: "Smart power strips cut power to all connected devices when your main device (like a TV) is off, eliminating phantom load automatically without you needing to think about it." },
  { id: "he-seal", name: "Seal a drafty window or door gap", emoji: "🏠", category: "Home Efficiency", difficulty: "Medium", timeLabel: "30 min", savingsPerYear: 55, co2LbsPerYear: 264, co2KgSaved: 120, points: 100, whyItMatters: "Air leaks can account for 25–40% of heating and cooling losses. Weather-stripping and caulk cost a few dollars but can cut energy bills by hundreds annually." },
  { id: "he-draft", name: "Add door draft stoppers", emoji: "🚪", category: "Home Efficiency", difficulty: "Medium", timeLabel: "10 min", savingsPerYear: 45, co2LbsPerYear: 220, co2KgSaved: 100, points: 100, whyItMatters: "Door gaps allow conditioned air to escape and outside air to enter, forcing your HVAC system to work harder. Draft stoppers are inexpensive and immediately reduce energy loss." },
  { id: "he-program", name: "Program a thermostat schedule", emoji: "📅", category: "Home Efficiency", difficulty: "Hard", timeLabel: "20 min", savingsPerYear: 180, co2LbsPerYear: 594, co2KgSaved: 270, points: 250, whyItMatters: "Programmable thermostats can reduce heating and cooling costs by 10–15% simply by adjusting temperature when you're asleep or away from home." },
  { id: "he-weatherize", name: "Weatherize doors and windows completely", emoji: "🔧", category: "Home Efficiency", difficulty: "Hard", timeLabel: "2–4 hrs", savingsPerYear: 250, co2LbsPerYear: 770, co2KgSaved: 350, points: 250, whyItMatters: "A full weatherization — caulking, weather stripping, door sweeps — can reduce home energy use by 15–20%. It's one of the most cost-effective home efficiency upgrades." },

  // ── Transportation ──
  { id: "tr-walk", name: "Walk or bike instead of driving", emoji: "🚲", category: "Transportation", difficulty: "Easy", timeLabel: "varies", savingsPerYear: 70, co2LbsPerYear: 374, co2KgSaved: 170, points: 50, whyItMatters: "Transportation is the single largest source of greenhouse gas emissions in the US. Replacing short car trips with walking or biking makes a measurable difference." },
  { id: "tr-tires", name: "Check and inflate your tires properly", emoji: "🚗", category: "Transportation", difficulty: "Easy", timeLabel: "10 min", savingsPerYear: 30, co2LbsPerYear: 176, co2KgSaved: 80, points: 50, whyItMatters: "Under-inflated tires can reduce fuel efficiency by up to 3%. Keeping tires properly inflated is free and one of the most overlooked fuel-saving actions." },
  { id: "tr-errands", name: "Combine all errands into one trip", emoji: "🗺️", category: "Transportation", difficulty: "Easy", timeLabel: "planning", savingsPerYear: 55, co2LbsPerYear: 264, co2KgSaved: 120, points: 50, whyItMatters: "Most car emissions occur in the first few minutes when the engine is cold. Combining trips reduces cold starts and cuts total miles driven." },
  { id: "tr-transit", name: "Take public transit for one commute", emoji: "🚌", category: "Transportation", difficulty: "Easy", timeLabel: "varies", savingsPerYear: 80, co2LbsPerYear: 330, co2KgSaved: 150, points: 50, whyItMatters: "Full buses and trains emit 45–76% less CO₂ per passenger mile than single-occupant cars. Even occasional transit use adds up significantly over a year." },
  { id: "tr-carpool", name: "Carpool to work or school once", emoji: "🚙", category: "Transportation", difficulty: "Medium", timeLabel: "coordination", savingsPerYear: 100, co2LbsPerYear: 440, co2KgSaved: 200, points: 100, whyItMatters: "If every American car carried just one additional passenger, total vehicle miles traveled and emissions would fall dramatically. Carpooling halves your per-trip emissions instantly." },
  { id: "tr-wfh", name: "Work from home for one day", emoji: "💻", category: "Transportation", difficulty: "Medium", timeLabel: "0 min", savingsPerYear: 90, co2LbsPerYear: 396, co2KgSaved: 180, points: 100, whyItMatters: "The average US commute is 27 miles round-trip. Remote work one day per week reduces annual commuting emissions by 20% and saves on gas costs." },
  { id: "tr-ev", name: "Research or test drive an EV", emoji: "⚡", category: "Transportation", difficulty: "Hard", timeLabel: "1–2 hrs", savingsPerYear: 900, co2LbsPerYear: 4400, co2KgSaved: 2000, points: 250, whyItMatters: "Electric vehicles produce zero tailpipe emissions. Even charged on the current US grid, EVs emit 50–70% less CO₂ per mile than gasoline vehicles — and the advantage grows as the grid gets cleaner." },

  // ── Renewables ──
  { id: "re-solar", name: "Research community solar programs", emoji: "☀️", category: "Renewables", difficulty: "Medium", timeLabel: "20 min", savingsPerYear: 200, co2LbsPerYear: 110, co2KgSaved: 50, points: 100, whyItMatters: "Community solar lets renters and homeowners without suitable roofs buy a share of a local solar farm. It's one of the highest-impact individual actions — and often reduces your electric bill." },
  { id: "re-plans", name: "Compare green electricity plans", emoji: "🔋", category: "Renewables", difficulty: "Medium", timeLabel: "20 min", savingsPerYear: 150, co2LbsPerYear: 110, co2KgSaved: 50, points: 100, whyItMatters: "Many utilities offer green tariff or renewable energy certificate programs. Switching signals market demand for clean generation and directly funds renewable projects." },
  { id: "re-audit", name: "Request a home energy audit", emoji: "📋", category: "Renewables", difficulty: "Hard", timeLabel: "scheduling", savingsPerYear: 400, co2LbsPerYear: 660, co2KgSaved: 300, points: 250, whyItMatters: "A professional energy audit identifies exactly where your home is wasting energy. Most audits pay for themselves in under two years through reduced energy bills." },
  { id: "re-rooftop", name: "Research rooftop solar for your home", emoji: "🏠", category: "Renewables", difficulty: "Hard", timeLabel: "1 hr", savingsPerYear: 1200, co2LbsPerYear: 440, co2KgSaved: 200, points: 250, whyItMatters: "Residential solar installations have fallen more than 90% in cost over the last decade. Many homeowners break even in 6–8 years and produce clean electricity for 25+ years after." },
  { id: "re-signup", name: "Sign up for a green energy plan", emoji: "🌿", category: "Renewables", difficulty: "Expert", timeLabel: "30 min", savingsPerYear: 300, co2LbsPerYear: 3300, co2KgSaved: 1500, points: 500, whyItMatters: "Enrolling in a 100% renewable electricity plan means your home's electricity use is matched by clean generation. It's the single biggest step most people can take without solar panels." },
  { id: "re-install", name: "Commit to a solar installation", emoji: "⚡", category: "Renewables", difficulty: "Expert", timeLabel: "project", savingsPerYear: 1500, co2LbsPerYear: 4400, co2KgSaved: 2000, points: 500, whyItMatters: "Installing rooftop solar typically eliminates most or all of a household's electricity emissions for 25+ years. With federal tax credits, many systems pay for themselves in under 7 years." },

  // ── Community ──
  { id: "co-share", name: "Share this challenge with a friend", emoji: "📣", category: "Community", difficulty: "Easy", timeLabel: "2 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 50, whyItMatters: "Community challenges are more effective when more people participate. Each new member multiplies the collective impact — your network is a powerful force for change." },
  { id: "co-invite", name: "Invite a neighbor to join", emoji: "👋", category: "Community", difficulty: "Medium", timeLabel: "5 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 100, whyItMatters: "Neighbors influence each other's behavior more than almost any other social group. Peer-to-peer outreach is one of the most effective ways to spread energy action." },
  { id: "co-recruit", name: "Recruit a new team member", emoji: "🤝", category: "Community", difficulty: "Medium", timeLabel: "10 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 100, whyItMatters: "Every additional team member expands your collective impact, improves your ranking, and brings in new ideas. Team challenges work best as genuine group efforts." },
  { id: "co-talk", name: "Talk to family about energy choices", emoji: "💬", category: "Community", difficulty: "Medium", timeLabel: "15 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 100, whyItMatters: "Research shows that conversations with family and friends are among the most effective ways to shift energy behaviors. Personal relationships drive change that advertising can't." },
  { id: "co-event", name: "Attend a local clean energy event", emoji: "📍", category: "Community", difficulty: "Hard", timeLabel: "1–3 hrs", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 250, whyItMatters: "Local energy meetings, community solar forums, and utility open houses give you direct input into your community's energy future and connect you with local advocates." },
  { id: "co-utility", name: "Contact your utility about green programs", emoji: "📞", category: "Community", difficulty: "Hard", timeLabel: "20 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 250, whyItMatters: "Utilities respond to customer demand. Calling or emailing your utility to ask about green tariffs, solar programs, or net metering sends a clear market signal." },

  // ── Learning ──
  { id: "le-grid", name: "Read about how your local grid works", emoji: "📖", category: "Learning", difficulty: "Easy", timeLabel: "15 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 50, whyItMatters: "Understanding how electricity is generated and distributed in your region helps you make more informed decisions — and makes energy topics less abstract." },
  { id: "le-sim", name: "Complete the Energy Mix Simulator", emoji: "⚡", category: "Learning", difficulty: "Easy", timeLabel: "10 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 50, whyItMatters: "The simulator on this site lets you design your own electricity grid and see real-time tradeoffs between cost, carbon, and renewables. It's the fastest way to build grid intuition." },
  { id: "le-video", name: "Watch a renewable energy explainer video", emoji: "📺", category: "Learning", difficulty: "Easy", timeLabel: "20 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 50, whyItMatters: "Visual learning accelerates understanding. Spending 20 minutes watching a high-quality explainer on wind, solar, or grid storage can transform how you see the energy transition." },
  { id: "le-demand", name: "Learn about demand response programs", emoji: "📊", category: "Learning", difficulty: "Medium", timeLabel: "20 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 100, whyItMatters: "Demand response programs pay households to reduce electricity use during grid stress events. Understanding them helps you participate and earn bill credits while helping grid reliability." },
  { id: "le-estar", name: "Research EPA Energy Star programs", emoji: "⭐", category: "Learning", difficulty: "Medium", timeLabel: "20 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 100, whyItMatters: "ENERGY STAR certified products use 10–50% less energy than standard models. Knowing the certification criteria helps you make smarter purchasing decisions for appliances." },
  { id: "le-region", name: "Study your regional grid operator (ISO)", emoji: "🗺️", category: "Learning", difficulty: "Hard", timeLabel: "30 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 250, whyItMatters: "Grid operators like PJM, MISO, CAISO, and ERCOT balance electricity supply and demand across millions of people. Understanding your ISO helps you see how individual actions connect to the larger system." },
  { id: "le-advanced", name: "Submit an advanced simulator design", emoji: "🏆", category: "Learning", difficulty: "Hard", timeLabel: "20 min", savingsPerYear: 0, co2LbsPerYear: 0, co2KgSaved: 0, points: 250, whyItMatters: "Building a high-scoring grid in the simulator requires balancing renewables, reliability, cost, and emissions — the same tradeoffs real grid engineers face every day." },
];

const MISSION_CATEGORIES: MissionCategory[] = ["Daily Habits", "Home Efficiency", "Transportation", "Renewables", "Community", "Learning"];

const PERSONAL_LEVELS = [
  { level: 1, name: "Energy Explorer", icon: "🌱", minXp: 0, maxXp: 200, color: "text-green-600" },
  { level: 2, name: "Climate Advocate", icon: "🌍", minXp: 200, maxXp: 500, color: "text-teal-600" },
  { level: 3, name: "Neighborhood Helper", icon: "🤝", minXp: 500, maxXp: 1000, color: "text-blue-600" },
  { level: 4, name: "Community Leader", icon: "⚡", minXp: 1000, maxXp: 2000, color: "text-purple-600" },
  { level: 5, name: "Grid Champion", icon: "🌟", minXp: 2000, maxXp: Infinity, color: "text-amber-600" },
];

const TEAM_TIERS = [
  { tier: "Bronze",   emoji: "🥉", minPts: 0,     color: "text-orange-700",  bg: "bg-orange-50  border-orange-200" },
  { tier: "Silver",   emoji: "🥈", minPts: 2500,  color: "text-slate-600",   bg: "bg-slate-50   border-slate-200" },
  { tier: "Gold",     emoji: "🥇", minPts: 7500,  color: "text-amber-600",   bg: "bg-amber-50   border-amber-200" },
  { tier: "Platinum", emoji: "🔮", minPts: 15000, color: "text-indigo-600",  bg: "bg-indigo-50  border-indigo-200" },
  { tier: "Diamond",  emoji: "💎", minPts: 30000, color: "text-sky-600",     bg: "bg-sky-50     border-sky-200" },
];

const ACHIEVEMENTS_DEF = [
  { id: "first-step",    name: "First Step",         icon: "👣", rarity: "Common",    desc: "Complete your first mission" },
  { id: "quick-learner", name: "Quick Learner",       icon: "📚", rarity: "Common",    desc: "Complete 5 missions" },
  { id: "veteran",       name: "Mission Veteran",     icon: "🎯", rarity: "Rare",      desc: "Complete 10 missions" },
  { id: "champion",      name: "Challenge Champion",  icon: "🏆", rarity: "Epic",      desc: "Complete 25 missions" },
  { id: "team-player",   name: "Team Player",         icon: "🤝", rarity: "Common",    desc: "Join or create a team" },
  { id: "streak-3",      name: "Streak Starter",      icon: "🔥", rarity: "Common",    desc: "Maintain a 3-day visit streak" },
  { id: "streak-7",      name: "Week Warrior",        icon: "🔥", rarity: "Rare",      desc: "Maintain a 7-day visit streak" },
  { id: "grid-designer", name: "Grid Designer",       icon: "⚡", rarity: "Rare",      desc: "Submit a simulator design to the challenge" },
  { id: "carbon-100",    name: "Carbon Crusher",      icon: "🌿", rarity: "Rare",      desc: "Earn 500+ XP" },
  { id: "rising-star",   name: "Rising Star",         icon: "⭐", rarity: "Rare",      desc: "Reach Level 3: Neighborhood Helper" },
  { id: "power-user",    name: "Power User",          icon: "💪", rarity: "Epic",      desc: "Earn 1,000+ XP" },
  { id: "grid-champion", name: "Grid Champion",       icon: "🌟", rarity: "Legendary", desc: "Reach Level 5: Grid Champion" },
];

const RARITY_COLORS: Record<string, string> = {
  Common: "text-slate-500 border-slate-200 bg-slate-50",
  Rare: "text-blue-600 border-blue-200 bg-blue-50",
  Epic: "text-purple-600 border-purple-200 bg-purple-50",
  Legendary: "text-amber-600 border-amber-200 bg-amber-50",
};

const ACTIVITY_ICONS: Record<string, string> = {
  pledge: "✅", simulator: "⚡", join: "👋", achievement: "🏆", share: "🔗",
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

// ─── Utility functions ────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getPersonalLevel(xp: number) {
  const lvl = [...PERSONAL_LEVELS].reverse().find((l) => xp >= l.minXp) ?? PERSONAL_LEVELS[0]!;
  const next = PERSONAL_LEVELS.find((l) => l.level === lvl.level + 1);
  const progress = next ? Math.min(100, Math.round(((xp - lvl.minXp) / (lvl.maxXp - lvl.minXp)) * 100)) : 100;
  return { ...lvl, next, progress, xp };
}

function getTeamTier(points: number) {
  return [...TEAM_TIERS].reverse().find((t) => points >= t.minPts) ?? TEAM_TIERS[0]!;
}

function co2Equivalencies(tons: number) {
  return {
    trees: Math.round((tons * 1000) / 21),
    cars: parseFloat((tons / 4.6).toFixed(1)),
    homes: Math.round((tons * 1000) / 1200),
  };
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (Math.abs(s) / 0x7fffffff);
  };
}

function getDailyMissions(dateStr: string): Mission[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed = ((seed << 5) - seed + dateStr.charCodeAt(i)) | 0;
  const rand = seededRand(Math.abs(seed));
  const pool = [...ALL_MISSIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, 3);
}

function getOrUpdateStreak(): { current: number; longest: number } {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const raw = localStorage.getItem("challenge_streak_v3");
  const data: { current: number; longest: number; lastDate: string } = raw
    ? JSON.parse(raw)
    : { current: 0, longest: 0, lastDate: "" };
  if (data.lastDate === today) return { current: data.current, longest: data.longest };
  const current = data.lastDate === yesterday ? data.current + 1 : 1;
  const longest = Math.max(data.longest, current);
  localStorage.setItem("challenge_streak_v3", JSON.stringify({ current, longest, lastDate: today }));
  return { current, longest };
}

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const frameRef = { id: 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setVal(Math.round(eased * target));
      if (p < 1) { frameRef.id = requestAnimationFrame(tick); }
    };
    frameRef.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.id);
  }, [target]);
  return val;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Challenge() {
  const qc = useQueryClient();

  // API
  const { data: stats, isLoading: statsLoading } = useGetChallengeStats({ query: { queryKey: getGetChallengeStatsQueryKey(), staleTime: 15_000 } });
  const { data: leaderboard, isLoading: lbLoading } = useGetChallengeLeaderboard({ query: { queryKey: getGetChallengeLeaderboardQueryKey(), staleTime: 15_000 } });
  const { data: campaign, isLoading: campaignLoading } = useGetCurrentCampaign({ query: { queryKey: getGetCurrentCampaignQueryKey(), staleTime: 60_000 } });
  const { data: feed, isLoading: feedLoading } = useGetChallengeFeed({ query: { queryKey: getGetChallengeFeedQueryKey(), staleTime: 0, refetchInterval: 30_000 } });
  const { mutateAsync: createTeam, isPending: isCreating } = useCreateChallengeTeam();
  const { mutateAsync: joinTeam, isPending: isJoining } = useJoinChallengeTeam();
  const { mutateAsync: submitPledge } = useSubmitChallengePledge();

  // Persistent state
  const [myTeam, setMyTeam] = useState<ChallengeTeam | null>(null);
  const [personalXp, setPersonalXp] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [dailyCompletedIds, setDailyCompletedIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [simSubmitted, setSimSubmitted] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<MissionCategory>("Daily Habits");
  const [sortKey, setSortKey] = useState<"points" | "co2" | "members" | "missions">("points");
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", type: "School", city: "", description: "" });
  const [joinCode, setJoinCode] = useState("");
  const [formError, setFormError] = useState("");
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [teamStaleCleared, setTeamStaleCleared] = useState(false);

  // Ref so the leaderboard-validation effect can read myTeam without it being
  // a dependency — prevents evicting a just-created team before the fresh
  // leaderboard response arrives.
  const myTeamRef = useRef<ChallengeTeam | null>(null);
  myTeamRef.current = myTeam;

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const savedTeam = localStorage.getItem("challenge_team");
    if (savedTeam) { try { setMyTeam(JSON.parse(savedTeam)); } catch { /* ignore */ } }
    const savedXp = localStorage.getItem("challenge_xp_v3");
    if (savedXp) setPersonalXp(parseInt(savedXp, 10) || 0);
    const savedMissions = localStorage.getItem("challenge_missions_v3");
    if (savedMissions) { try { setCompletedIds(new Set(JSON.parse(savedMissions))); } catch { /* ignore */ } }
    const savedDaily = localStorage.getItem(`challenge_daily_v3_${today}`);
    if (savedDaily) { try { setDailyCompletedIds(new Set(JSON.parse(savedDaily))); } catch { /* ignore */ } }
    setStreak(getOrUpdateStreak());
    setSimSubmitted(localStorage.getItem("challenge_sim_submitted") === "true");
  }, [today]);

  // Auto-validate team against leaderboard — clears stale teams after server restart.
  // Only depends on leaderboard (not myTeam) so a just-created team isn't evicted
  // before the fresh leaderboard response arrives.
  useEffect(() => {
    const team = myTeamRef.current;
    if (!leaderboard || !team) return;
    const found = leaderboard.some((e: LeaderboardEntry) => e.id === team.id);
    if (!found) {
      localStorage.removeItem("challenge_team");
      setMyTeam(null);
      setTeamStaleCleared(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard]);

  const persistTeam = useCallback((team: ChallengeTeam) => {
    setMyTeam(team);
    localStorage.setItem("challenge_team", JSON.stringify(team));
  }, []);

  const invalidateAll = useCallback(() => {
    void qc.invalidateQueries({ queryKey: getGetChallengeStatsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetChallengeLeaderboardQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetChallengeFeedQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetCurrentCampaignQueryKey() });
  }, [qc]);

  const handleCreate = async () => {
    setFormError("");
    if (!createForm.name.trim()) { setFormError("Team name is required."); return; }
    try {
      const team = await createTeam({ data: { name: createForm.name.trim(), type: createForm.type, city: createForm.city || null, description: createForm.description || null } });
      persistTeam(team);
      setShowCreate(false);
      invalidateAll();
    } catch { setFormError("Something went wrong. Please try again."); }
  };

  const handleJoin = async () => {
    setFormError("");
    if (!joinCode.trim()) { setFormError("Enter a join code."); return; }
    try {
      const team = await joinTeam({ data: { joinCode: joinCode.trim(), memberName: null } });
      persistTeam(team);
      setShowJoin(false);
      setJoinCode("");
      invalidateAll();
    } catch { setFormError("Team not found. Check your join code and try again."); }
  };

  const handleLeaveTeam = () => {
    localStorage.removeItem("challenge_team");
    setMyTeam(null);
  };

  const handleMission = useCallback(async (mission: Mission) => {
    if (!myTeam || completedIds.has(mission.id)) return;
    try {
      const result = await submitPledge({
        data: { teamId: myTeam.id, pledgeId: mission.id, pledgeName: mission.name, co2KgSaved: mission.co2KgSaved, pointsToAward: mission.points },
      });
      const updated: ChallengeTeam = {
        ...myTeam,
        points: result.totalPoints,
        rank: result.newRank,
        estimatedCo2TonsSaved: result.estimatedCo2TonsSaved,
        missionsCompleted: result.missionsCompleted ?? (myTeam.missionsCompleted ?? 0) + 1,
      };
      persistTeam(updated);

      const nextCompleted = new Set(completedIds).add(mission.id);
      setCompletedIds(nextCompleted);
      localStorage.setItem("challenge_missions_v3", JSON.stringify([...nextCompleted]));

      const nextDaily = new Set(dailyCompletedIds).add(mission.id);
      setDailyCompletedIds(nextDaily);
      localStorage.setItem(`challenge_daily_v3_${today}`, JSON.stringify([...nextDaily]));

      const newXp = personalXp + mission.points;
      setPersonalXp(newXp);
      localStorage.setItem("challenge_xp_v3", String(newXp));

      setJustCompleted(mission.id);
      setMissionError(null);
      setTimeout(() => setJustCompleted(null), 2500);
      invalidateAll();
    } catch {
      setMissionError("Couldn't record this mission. Your team may have expired — re-join below to continue.");
      localStorage.removeItem("challenge_team");
      setMyTeam(null);
    }
  }, [myTeam, completedIds, dailyCompletedIds, personalXp, today, submitPledge, persistTeam, invalidateAll]);

  // Computed
  const myEntry = useMemo(() => leaderboard?.find((e: LeaderboardEntry) => e.id === myTeam?.id), [leaderboard, myTeam]);
  const myLevel = useMemo(() => getPersonalLevel(personalXp), [personalXp]);
  const myTier = useMemo(() => myEntry ? getTeamTier(myEntry.points) : null, [myEntry]);
  const dailyMissions = useMemo(() => getDailyMissions(today), [today]);
  const dailyCompleteCount = dailyMissions.filter((m) => dailyCompletedIds.has(m.id)).length;

  const sortedLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    return [...leaderboard].sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
      if (sortKey === "co2") return b.estimatedCo2TonsSaved - a.estimatedCo2TonsSaved;
      if (sortKey === "members") return b.memberCount - a.memberCount;
      if (sortKey === "missions") return (b.missionsCompleted ?? 0) - (a.missionsCompleted ?? 0);
      return b.points - a.points;
    }).map((e, i) => ({ ...e, displayRank: i + 1 }));
  }, [leaderboard, sortKey]);

  const achievements = useMemo(() => ACHIEVEMENTS_DEF.map((a) => ({
    ...a,
    unlocked:
      a.id === "first-step" ? completedIds.size >= 1 :
      a.id === "quick-learner" ? completedIds.size >= 5 :
      a.id === "veteran" ? completedIds.size >= 10 :
      a.id === "champion" ? completedIds.size >= 25 :
      a.id === "team-player" ? !!myTeam :
      a.id === "streak-3" ? streak.current >= 3 :
      a.id === "streak-7" ? streak.current >= 7 :
      a.id === "grid-designer" ? simSubmitted :
      a.id === "carbon-100" ? personalXp >= 500 :
      a.id === "rising-star" ? personalXp >= 500 :
      a.id === "power-user" ? personalXp >= 1000 :
      a.id === "grid-champion" ? personalXp >= 2000 : false,
  })), [completedIds, myTeam, streak, simSubmitted, personalXp]);

  const tabMissions = useMemo(() => ALL_MISSIONS.filter((m) => m.category === activeTab), [activeTab]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Stale-team notice */}
      {teamStaleCleared && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold">Your team session expired</p>
            <p className="text-amber-700/80 text-xs mt-0.5">The server restarted and reset team data. Re-join with your join code or create a new team below. Your XP and mission history are still saved locally.</p>
          </div>
          <button onClick={() => setTeamStaleCleared(false)} className="text-amber-600 hover:text-amber-900 font-bold text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}

      {/* Mission error notice */}
      {missionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="text-lg leading-none mt-0.5">❌</span>
          <div className="flex-1">
            <p className="font-semibold">Mission failed to save</p>
            <p className="text-red-700/80 text-xs mt-0.5">{missionError}</p>
          </div>
          <button onClick={() => setMissionError(null)} className="text-red-500 hover:text-red-800 font-bold text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}

      {/* Campaign Banner */}
      {campaignLoading
        ? <Skeleton className="h-44 rounded-2xl" />
        : campaign && <CampaignBanner campaign={campaign} />}

      {/* KPI Row */}
      <KpiGrid stats={stats} isLoading={statsLoading} />

      {/* Personal Dashboard */}
      <PersonalDashboard
        myLevel={myLevel}
        streak={streak}
        completedCount={completedIds.size}
        myEntry={myEntry}
        myTier={myTier}
      />

      {/* Daily Missions */}
      <DailyMissionsCard
        missions={dailyMissions}
        completedIds={completedIds}
        dailyCompletedIds={dailyCompletedIds}
        dailyCompleteCount={dailyCompleteCount}
        hasTeam={!!myTeam}
        justCompleted={justCompleted}
        onComplete={handleMission}
      />

      {/* My Team Banner */}
      {myTeam && myEntry && (
        <MyTeamBanner
          myTeam={myTeam}
          myEntry={myEntry}
          myTier={myTier!}
          showActivity={showActivity}
          setShowActivity={setShowActivity}
          onLeave={handleLeaveTeam}
        />
      )}

      {/* Mission Categories */}
      <MissionTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabMissions={tabMissions}
        completedIds={completedIds}
        hasTeam={!!myTeam}
        justCompleted={justCompleted}
        expandedMission={expandedMission}
        setExpandedMission={setExpandedMission}
        onComplete={handleMission}
      />

      {/* Leaderboard */}
      <LeaderboardSection
        leaderboard={sortedLeaderboard}
        isLoading={lbLoading}
        myTeamId={myTeam?.id}
        sortKey={sortKey}
        setSortKey={setSortKey}
      />

      {/* Join / Create */}
      {!myTeam && (
        <JoinSection
          showCreate={showCreate} setShowCreate={setShowCreate}
          showJoin={showJoin} setShowJoin={setShowJoin}
          createForm={createForm} setCreateForm={setCreateForm}
          joinCode={joinCode} setJoinCode={setJoinCode}
          formError={formError} setFormError={setFormError}
          isCreating={isCreating} isJoining={isJoining}
          onCreate={handleCreate} onJoin={handleJoin}
        />
      )}

      {/* Achievements */}
      <AchievementsSection achievements={achievements} />

      {/* Community Feed */}
      <CommunityFeedSection feed={feed} isLoading={feedLoading} />

      {/* How to Earn */}
      <HowToEarnCard />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CampaignBanner({ campaign }: { campaign: CurrentCampaign }) {
  const equiv = co2Equivalencies(campaign.currentCo2Tons);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#fef08a33,transparent_70%)] pointer-events-none" />
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">{campaign.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">July Challenge</span>
              <span className="text-xs font-black text-white bg-amber-500 px-2.5 py-1 rounded-full">{campaign.badgeLabel}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-amber-900">{campaign.title}</h2>
            <p className="text-sm text-amber-800/80 max-w-xl leading-relaxed">{campaign.description}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/70 backdrop-blur border border-amber-200 rounded-xl px-4 py-3 min-w-[72px]">
              <p className="text-3xl font-display font-black text-amber-700">{campaign.daysRemaining}</p>
              <p className="text-xs text-amber-600 font-semibold">days left</p>
            </div>
            <div className="text-center bg-white/70 backdrop-blur border border-amber-200 rounded-xl px-4 py-3 min-w-[72px]">
              <p className="text-2xl font-display font-black text-teal-700">{campaign.currentCo2Tons.toFixed(0)}</p>
              <p className="text-xs text-teal-600 font-semibold">tons CO₂</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Community Goal — {campaign.goalCo2Tons} tons CO₂</span>
            <span>{Math.round(campaign.progressPercent)}% complete</span>
          </div>
          <div className="h-3 bg-amber-100 border border-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(campaign.progressPercent, 100)}%` }} />
          </div>
          <p className="text-xs text-amber-600">
            That's roughly equivalent to 🌳 {equiv.trees} trees planted or 🚗 {equiv.cars} cars off the road for a year
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiGrid({ stats, isLoading }: { stats: { totalParticipants: number; totalTeams: number; estimatedCo2TonsSaved: number; totalSimulatorSubmissions: number } | undefined; isLoading: boolean }) {
  const participants = useCountUp(stats?.totalParticipants ?? 0);
  const teams = useCountUp(stats?.totalTeams ?? 0);
  const co2 = useCountUp(Math.round((stats?.estimatedCo2TonsSaved ?? 0) * 10)) / 10;
  const sims = useCountUp(stats?.totalSimulatorSubmissions ?? 0);
  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;
  const equiv = stats ? co2Equivalencies(stats.estimatedCo2TonsSaved) : { trees: 0, cars: 0, homes: 0 };
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard icon={<Users className="w-5 h-5" />} label="Participants" value={participants.toLocaleString()} color="bg-blue-50 border-blue-200 text-blue-900" />
      <KpiCard icon={<Trophy className="w-5 h-5" />} label="Active Teams" value={teams.toLocaleString()} color="bg-amber-50 border-amber-200 text-amber-900" />
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <KpiCard icon={<Leaf className="w-5 h-5" />} label="CO₂ Saved" value={`${(stats?.estimatedCo2TonsSaved ?? 0).toFixed(1)} tons`} color="bg-teal-50 border-teal-200 text-teal-900" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-xs space-y-1 p-3">
          <p className="font-semibold">Estimated CO₂ Reduction</p>
          <p>🌳 {equiv.trees} trees planted equivalent</p>
          <p>🚗 {equiv.cars} cars removed for a year</p>
          <p>🏠 {equiv.homes} homes' electricity for a year</p>
          <p className="opacity-70 pt-1">Based on EPA conversion factors and community mission completions.</p>
        </TooltipContent>
      </Tooltip>
      <KpiCard icon={<Zap className="w-5 h-5" />} label="Simulations Run" value={sims.toLocaleString()} color="bg-purple-50 border-purple-200 text-purple-900" />
    </div>
  );
}

function PersonalDashboard({ myLevel, streak, completedCount, myEntry, myTier }: {
  myLevel: ReturnType<typeof getPersonalLevel>;
  streak: { current: number; longest: number };
  completedCount: number;
  myEntry?: LeaderboardEntry;
  myTier: ReturnType<typeof getTeamTier> | null;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" />My Impact</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Level */}
        <Card className="shadow-sm border-border">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Level</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{myLevel.icon}</span>
              <div>
                <p className={cn("font-bold text-sm leading-tight", myLevel.color)}>{myLevel.name}</p>
                <p className="text-xs text-muted-foreground">Level {myLevel.level}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{myLevel.xp} XP</span>
                {myLevel.next && <span>{myLevel.next.minXp} XP</span>}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-700" style={{ width: `${myLevel.progress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Streak */}
        <Card className="shadow-sm border-border">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Streak</p>
            <div className="flex items-center gap-2">
              <Flame className={cn("w-6 h-6", streak.current > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
              <div>
                <p className="font-display font-bold text-2xl leading-tight">{streak.current}</p>
                <p className="text-xs text-muted-foreground">day{streak.current !== 1 ? "s" : ""} in a row</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Longest: {streak.longest} days</p>
          </CardContent>
        </Card>
        {/* Missions */}
        <Card className="shadow-sm border-border">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missions Done</p>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-teal-600" />
              <div>
                <p className="font-display font-bold text-2xl leading-tight">{completedCount}</p>
                <p className="text-xs text-muted-foreground">of {ALL_MISSIONS.length} total</p>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (completedCount / ALL_MISSIONS.length) * 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        {/* Team Rank / Tier */}
        <Card className="shadow-sm border-border">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Standing</p>
            {myEntry && myTier ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{myTier.emoji}</span>
                  <div>
                    <p className={cn("font-bold text-sm leading-tight", myTier.color)}>{myTier.tier}</p>
                    <p className="text-xs text-muted-foreground">Rank #{myEntry.rank}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{myEntry.points.toLocaleString()} points</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Join a team to see your ranking</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DailyMissionsCard({ missions, completedIds, dailyCompletedIds, dailyCompleteCount, hasTeam, justCompleted, onComplete }: {
  missions: Mission[];
  completedIds: Set<string>;
  dailyCompletedIds: Set<string>;
  dailyCompleteCount: number;
  hasTeam: boolean;
  justCompleted: string | null;
  onComplete: (m: Mission) => void;
}) {
  const allDone = dailyCompleteCount === 3;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Today's Daily Challenge</h2>
        <div className="flex items-center gap-2">
          {allDone && <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">🎉 All done! +300 bonus XP</span>}
          <span className="text-xs text-muted-foreground font-medium">{dailyCompleteCount}/3 completed</span>
        </div>
      </div>
      <Card className={cn("shadow-sm", allDone ? "border-amber-300 bg-amber-50/50" : "border-primary/20 bg-primary/5")}>
        <CardContent className="pt-4 pb-4 space-y-3">
          {!hasTeam && (
            <p className="text-sm text-muted-foreground bg-background/80 rounded-lg px-3 py-2 border border-border">
              📌 Join or create a team below to complete daily missions and earn points.
            </p>
          )}
          {missions.map((m) => {
            const done = completedIds.has(m.id);
            const isJust = justCompleted === m.id;
            return (
              <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                done ? "bg-teal-50 border-teal-200" : "bg-background border-border hover:border-primary/30")}>
                <span className="text-xl flex-shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm leading-tight", done && "line-through text-muted-foreground")}>{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", DIFFICULTY_COLORS[m.difficulty])}>{m.difficulty}</span>
                    <span className="text-xs text-muted-foreground">+{m.points} pts</span>
                  </div>
                </div>
                {done ? (
                  <span className={cn("text-xs font-bold text-teal-600 flex-shrink-0", isJust && "animate-in zoom-in duration-300")}>✓ Done!</span>
                ) : (
                  <Button size="sm" className="flex-shrink-0 h-8 text-xs" onClick={() => onComplete(m)} disabled={!hasTeam}>
                    Complete
                  </Button>
                )}
              </div>
            );
          })}
          <div className="flex gap-1 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i < dailyCompleteCount ? "bg-amber-500" : "bg-muted")} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MyTeamBanner({ myTeam, myEntry, myTier, showActivity, setShowActivity, onLeave }: {
  myTeam: ChallengeTeam;
  myEntry: LeaderboardEntry;
  myTier: ReturnType<typeof getTeamTier>;
  showActivity: boolean;
  setShowActivity: (v: boolean) => void;
  onLeave: () => void;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/15 rounded-xl"><Award className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Your Team</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-display font-bold text-primary">{myTeam.name}</p>
                <TierBadge tier={myTier} compact />
              </div>
              <p className="text-sm text-muted-foreground">{myTeam.type}{myTeam.city ? ` · ${myTeam.city}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-center">
              <div><p className="text-2xl font-display font-bold text-primary">{myEntry.points.toLocaleString()}</p><p className="text-xs text-muted-foreground">points</p></div>
              <div><p className="text-2xl font-display font-bold text-primary">#{myEntry.rank}</p><p className="text-xs text-muted-foreground">rank</p></div>
              <div><p className="text-2xl font-display font-bold text-teal-700">{myEntry.estimatedCo2TonsSaved.toFixed(1)}</p><p className="text-xs text-muted-foreground">tons CO₂</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={onLeave}>Leave</Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-primary/15">
          <span>Join code:</span>
          <code className="font-mono bg-background border border-border rounded px-2 py-0.5 font-bold tracking-widest text-sm">{myTeam.joinCode}</code>
          <span className="hidden sm:inline">— share so teammates can join</span>
        </div>
        {myTeam.recentActivity?.length > 0 && (
          <>
            <button onClick={() => setShowActivity(!showActivity)} className="flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary">
              <Activity className="w-4 h-4" />Recent Activity
              {showActivity ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showActivity && (
              <ul className="space-y-2 animate-in fade-in duration-200">
                {myTeam.recentActivity.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 mt-0.5">{ACTIVITY_ICONS[item.type] ?? "•"}</span>
                    <span>{item.text}</span>
                    <span className="ml-auto shrink-0 flex items-center gap-1 text-xs opacity-60"><Clock className="w-3 h-3" />{timeAgo(item.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MissionTabs({ activeTab, setActiveTab, tabMissions, completedIds, hasTeam, justCompleted, expandedMission, setExpandedMission, onComplete }: {
  activeTab: MissionCategory;
  setActiveTab: (t: MissionCategory) => void;
  tabMissions: Mission[];
  completedIds: Set<string>;
  hasTeam: boolean;
  justCompleted: string | null;
  expandedMission: string | null;
  setExpandedMission: (id: string | null) => void;
  onComplete: (m: Mission) => void;
}) {
  const completedInTab = tabMissions.filter((m) => completedIds.has(m.id)).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-600" />Mission Library</h2>
        {!hasTeam && <p className="text-xs text-muted-foreground">Join a team to earn points</p>}
      </div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {MISSION_CATEGORIES.map((cat) => {
          const catDone = ALL_MISSIONS.filter((m) => m.category === cat && completedIds.has(m.id)).length;
          const catTotal = ALL_MISSIONS.filter((m) => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all duration-150 flex-shrink-0",
                activeTab === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {CATEGORY_ICONS[cat]}
              <span className="hidden sm:inline">{cat}</span>
              <span className="sm:hidden">{cat.split(" ")[0]}</span>
              {catDone > 0 && <span className={cn("text-[10px] font-bold px-1 rounded", activeTab === cat ? "bg-white/20" : "bg-teal-100 text-teal-700")}>{catDone}/{catTotal}</span>}
            </button>
          );
        })}
      </div>
      {/* Progress for current tab */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${(completedInTab / tabMissions.length) * 100}%` }} />
        </div>
        <span>{completedInTab}/{tabMissions.length} in {activeTab}</span>
      </div>
      {/* Mission grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tabMissions.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            done={completedIds.has(m.id)}
            isJust={justCompleted === m.id}
            canComplete={hasTeam}
            expanded={expandedMission === m.id}
            onToggleExpand={() => setExpandedMission(expandedMission === m.id ? null : m.id)}
            onComplete={onComplete}
          />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission, done, isJust, canComplete, expanded, onToggleExpand, onComplete }: {
  mission: Mission;
  done: boolean;
  isJust: boolean;
  canComplete: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onComplete: (m: Mission) => void;
}) {
  return (
    <div className={cn("rounded-xl border transition-all duration-200", done ? "bg-teal-50 border-teal-200" : "bg-background border-border hover:border-primary/30 hover:shadow-sm")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{mission.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={cn("font-semibold text-sm leading-snug", done && "text-muted-foreground line-through")}>{mission.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", DIFFICULTY_COLORS[mission.difficulty])}>{mission.difficulty}</span>
              {mission.timeLabel !== "0 min" && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{mission.timeLabel}</span>
              )}
              {mission.savingsPerYear > 0 && <span className="text-[10px] text-green-700 font-medium">${mission.savingsPerYear}/yr</span>}
              {mission.co2LbsPerYear > 0 && <span className="text-[10px] text-teal-700 font-medium">{mission.co2LbsPerYear} lbs CO₂/yr</span>}
            </div>
          </div>
          <span className={cn("text-sm font-bold flex-shrink-0", done ? "text-teal-600" : "text-primary")}>
            {done ? (isJust ? "✓ +pts!" : "✓") : `+${mission.points}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onToggleExpand} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3 h-3" />Why it matters
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {!done && (
            <Button size="sm" className="h-7 text-xs px-3" onClick={() => onComplete(mission)} disabled={!canComplete}>
              {canComplete ? "Complete" : "Join team first"}
            </Button>
          )}
        </div>
        {expanded && (
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2 animate-in fade-in duration-200">
            {mission.whyItMatters}
          </p>
        )}
      </div>
    </div>
  );
}

function LeaderboardSection({ leaderboard, isLoading, myTeamId, sortKey, setSortKey }: {
  leaderboard: (LeaderboardEntry & { displayRank: number })[];
  isLoading: boolean;
  myTeamId?: string;
  sortKey: string;
  setSortKey: (k: "points" | "co2" | "members" | "missions") => void;
}) {
  const SORT_OPTIONS: { key: "points" | "co2" | "members" | "missions"; label: string }[] = [
    { key: "points", label: "Points" },
    { key: "co2", label: "CO₂" },
    { key: "members", label: "Members" },
    { key: "missions", label: "Missions" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Leaderboard</h2>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setSortKey(opt.key)}
              className={cn("text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                sortKey === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/30")}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-sm" aria-label="Challenge leaderboard">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">Rank</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Team</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Members</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Missions</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">CO₂</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const isMe = entry.id === myTeamId;
                  const tier = getTeamTier(entry.points);
                  return (
                    <tr key={entry.id} className={cn("border-b border-border last:border-0 transition-colors", isMe ? "bg-primary/5" : "hover:bg-muted/30")}>
                      <td className="px-4 py-3 font-bold text-muted-foreground">
                        {i < 3 ? <span className="text-lg">{RANK_MEDALS[i]}</span> : `#${entry.displayRank}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{tier.emoji}</span>
                          <div>
                            <span className={cn("font-semibold", isMe && "text-primary")}>{entry.name}</span>
                            {isMe && <span className="ml-1.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>}
                            {entry.city && <span className="block text-xs text-muted-foreground">{entry.city}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell"><TypeBadge type={entry.type} /></td>
                      <td className="px-4 py-3 text-right">{entry.memberCount}</td>
                      <td className="px-4 py-3 text-right font-medium">{entry.missionsCompleted}</td>
                      <td className="px-4 py-3 text-right text-teal-700 font-semibold">{entry.estimatedCo2TonsSaved.toFixed(1)}t</td>
                      <td className="px-4 py-3 text-right font-bold">{entry.points.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {leaderboard.map((entry, i) => {
              const isMe = entry.id === myTeamId;
              const tier = getTeamTier(entry.points);
              return (
                <div key={entry.id} className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-primary/5")}>
                  <div className="w-8 text-center font-bold text-muted-foreground flex-shrink-0">
                    {i < 3 ? <span className="text-lg">{RANK_MEDALS[i]}</span> : `#${entry.displayRank}`}
                  </div>
                  <span className="text-lg flex-shrink-0">{tier.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm truncate", isMe && "text-primary")}>{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.missionsCompleted} missions · {entry.estimatedCo2TonsSaved.toFixed(1)}t CO₂</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">{entry.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{entry.memberCount} members</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function JoinSection({ showCreate, setShowCreate, showJoin, setShowJoin, createForm, setCreateForm, joinCode, setJoinCode, formError, setFormError, isCreating, isJoining, onCreate, onJoin }: {
  showCreate: boolean; setShowCreate: (v: boolean) => void;
  showJoin: boolean; setShowJoin: (v: boolean) => void;
  createForm: { name: string; type: string; city: string; description: string };
  setCreateForm: (f: { name: string; type: string; city: string; description: string }) => void;
  joinCode: string; setJoinCode: (v: string) => void;
  formError: string; setFormError: (v: string) => void;
  isCreating: boolean; isJoining: boolean;
  onCreate: () => void; onJoin: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-bold">Join the Challenge</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Create a Team</CardTitle>
            <CardDescription>Start a new team for your school, neighborhood, or group.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCreate ? (
              <Button onClick={() => { setShowCreate(true); setShowJoin(false); setFormError(""); }} className="w-full" size="lg">Create New Team</Button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2"><Label htmlFor="team-name">Team Name <span className="text-destructive">*</span></Label>
                  <Input id="team-name" placeholder="e.g. Riverside High School" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="team-type">Team Type</Label>
                  <select id="team-type" value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {TEAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select></div>
                <div className="space-y-2"><Label htmlFor="team-city">City (optional)</Label>
                  <Input id="team-city" placeholder="e.g. Austin, TX" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="team-desc">Description (optional)</Label>
                  <Textarea id="team-desc" placeholder="What is your team about?" className="min-h-[70px] resize-none" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} /></div>
                {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
                <div className="flex gap-2">
                  <Button onClick={onCreate} disabled={isCreating} className="flex-1">{isCreating ? "Creating…" : "Create Team"}</Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2"><LogIn className="w-5 h-5 text-primary" />Join a Team</CardTitle>
            <CardDescription>Have a join code? Enter it to join your team's challenge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showJoin ? (
              <Button variant="outline" onClick={() => { setShowJoin(true); setShowCreate(false); setFormError(""); }} className="w-full" size="lg">Enter Join Code</Button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2"><Label htmlFor="join-code">Join Code</Label>
                  <Input id="join-code" placeholder="e.g. NCS77" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="font-mono text-lg tracking-widest text-center" maxLength={8} /></div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3"><strong>Try a demo code:</strong> NCS77, GRN42, MVD91, LPN34, T247X, or BKL08</div>
                {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
                <div className="flex gap-2">
                  <Button onClick={onJoin} disabled={isJoining} className="flex-1">{isJoining ? "Joining…" : "Join Team"}</Button>
                  <Button variant="outline" onClick={() => setShowJoin(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AchievementsSection({ achievements }: { achievements: typeof ACHIEVEMENTS_DEF[number] extends object ? (typeof ACHIEVEMENTS_DEF[number] & { unlocked: boolean })[] : never[] }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" />Achievements</h2>
        <span className="text-xs text-muted-foreground">{unlocked}/{achievements.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {achievements.map((a) => (
          <div key={a.id} className={cn("rounded-xl border p-3 text-center space-y-1 transition-all duration-200",
            a.unlocked ? RARITY_COLORS[a.rarity] : "bg-muted/40 border-border opacity-50 grayscale")}>
            <p className="text-2xl">{a.icon}</p>
            <p className="text-xs font-bold leading-tight">{a.name}</p>
            <p className={cn("text-[10px] font-semibold", a.unlocked ? "" : "text-muted-foreground")}>{a.rarity}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityFeedSection({ feed, isLoading }: { feed: FeedItem[] | undefined; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Community Activity</h2>
        <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>
      <Card className="shadow-sm border-border">
        <CardContent className="pt-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : !feed?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No community activity yet — be the first!</p>
          ) : (
            <ul className="divide-y divide-border">
              {feed.slice(0, 12).map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="shrink-0 mt-0.5 text-base">{ACTIVITY_ICONS[item.type] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">{item.text}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">by {item.teamName}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(item.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HowToEarnCard() {
  const actions = [
    { label: "Complete an Easy mission", pts: 50, icon: "✅" },
    { label: "Complete a Medium mission", pts: 100, icon: "🎯" },
    { label: "Complete a Hard mission", pts: 250, icon: "🔥" },
    { label: "Complete an Expert mission", pts: 500, icon: "⚡" },
    { label: "Submit a simulator design", pts: 100, icon: "🖥️" },
    { label: "Finish all 3 daily missions", pts: 300, icon: "📅" },
  ];
  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display font-bold flex items-center gap-2"><Info className="w-4 h-4 text-primary" />How to Earn Points</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {actions.map((a) => (
            <div key={a.label} className="flex items-center gap-2 text-sm">
              <span>{a.icon}</span>
              <span className="flex-1 text-muted-foreground">{a.label}</span>
              <span className="font-bold text-primary">+{a.pts}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    School: "bg-blue-50 text-blue-700 border-blue-200",
    Neighborhood: "bg-green-50 text-green-700 border-green-200",
    "Scout Troop": "bg-amber-50 text-amber-700 border-amber-200",
    Club: "bg-purple-50 text-purple-700 border-purple-200",
    "Community Group": "bg-teal-50 text-teal-700 border-teal-200",
    Other: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap", colors[type] ?? colors["Other"])}>{type}</span>;
}

function TierBadge({ tier, compact }: { tier: ReturnType<typeof getTeamTier>; compact?: boolean }) {
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", tier.bg, tier.color)}>
      {tier.emoji}{compact ? "" : " "}{tier.tier}
    </span>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cn("rounded-2xl border p-4 space-y-2", color)}>
      <div className="flex items-center gap-2 opacity-70">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-display font-bold tabular-nums">{value}</p>
    </div>
  );
}
