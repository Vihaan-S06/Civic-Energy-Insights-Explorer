export interface StateData {
  id: string;
  name: string;
  abbr: string;
  population: number;
  annualDemandTWh: number;
  avgPriceCents: number;
  gridScore: number;
  renewablePct: number;
  co2Intensity: number;
  budget: number;
  challenges: string[];
  mix: Record<EnergySourceId, number>;
  svgPath: string;
}

export type EnergySourceId = "gas" | "coal" | "nuclear" | "wind" | "solar" | "hydro";

export interface EnergySource {
  id: EnergySourceId;
  label: string;
  icon: string;
  co2: number;
  costMultiplier: number;
  color: string;
  constructionBillions: number;
  constructionYears: number;
  reliabilityScore: number;
  weatherDependent: boolean;
  publicApproval: number;
  isRenewable: boolean;
  description: string;
}

export interface Advisor {
  id: string;
  name: string;
  role: string;
  emoji: string;
  concern: string;
  reactions: {
    highRenewable: string;
    highFossil: string;
    highPrice: string;
    lowPrice: string;
    highReliability: string;
    lowReliability: string;
    neutral: string;
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  effects: Partial<Record<EnergySourceId, number>> & {
    budgetDelta?: number;
    reliabilityDelta?: number;
    demandMultiplier?: number;
    priceMultiplier?: number;
  };
  year: number;
}

export const ENERGY_SOURCES: EnergySource[] = [
  {
    id: "gas",
    label: "Natural Gas",
    icon: "🔥",
    co2: 490,
    costMultiplier: 1.0,
    color: "#f59e0b",
    constructionBillions: 1.2,
    constructionYears: 2,
    reliabilityScore: 90,
    weatherDependent: false,
    publicApproval: 52,
    isRenewable: false,
    description: "Reliable dispatchable power, but emits CO₂ and subject to price swings.",
  },
  {
    id: "coal",
    label: "Coal",
    icon: "⛏️",
    co2: 820,
    costMultiplier: 0.8,
    color: "#78716c",
    constructionBillions: 3.5,
    constructionYears: 4,
    reliabilityScore: 85,
    weatherDependent: false,
    publicApproval: 22,
    isRenewable: false,
    description: "Cheapest fuel but highest carbon emissions. Political pressure to retire.",
  },
  {
    id: "nuclear",
    label: "Nuclear",
    icon: "⚛️",
    co2: 12,
    costMultiplier: 1.2,
    color: "#8b5cf6",
    constructionBillions: 9.0,
    constructionYears: 7,
    reliabilityScore: 95,
    weatherDependent: false,
    publicApproval: 48,
    isRenewable: false,
    description: "Nearly carbon-free and highly reliable, but very expensive to build.",
  },
  {
    id: "wind",
    label: "Wind",
    icon: "💨",
    co2: 11,
    costMultiplier: 0.9,
    color: "#06b6d4",
    constructionBillions: 2.1,
    constructionYears: 3,
    reliabilityScore: 55,
    weatherDependent: true,
    publicApproval: 78,
    isRenewable: true,
    description: "Cheap and clean, but output depends on wind speed. Needs backup.",
  },
  {
    id: "solar",
    label: "Solar",
    icon: "☀️",
    co2: 45,
    costMultiplier: 0.85,
    color: "#eab308",
    constructionBillions: 1.8,
    constructionYears: 2,
    reliabilityScore: 50,
    weatherDependent: true,
    publicApproval: 85,
    isRenewable: true,
    description: "Rapidly falling costs. Only generates during daylight hours.",
  },
  {
    id: "hydro",
    label: "Hydropower",
    icon: "💧",
    co2: 4,
    costMultiplier: 0.7,
    color: "#3b82f6",
    constructionBillions: 5.5,
    constructionYears: 6,
    reliabilityScore: 75,
    weatherDependent: true,
    publicApproval: 65,
    isRenewable: true,
    description: "Clean and dispatchable, but capacity is geographically limited.",
  },
];

export const ADVISORS: Advisor[] = [
  {
    id: "engineer",
    name: "Morgan Chen",
    role: "Grid Engineer",
    emoji: "⚡",
    concern: "I'm worried about blackouts.",
    reactions: {
      highRenewable: "Variable sources are rising. We need more storage or gas backup to keep the lights on.",
      highFossil: "Fossil plants are reliable — but we're exposed to fuel price shocks.",
      highPrice: "High electricity costs will strain our infrastructure budget.",
      lowPrice: "Good pricing. We can reinvest savings into grid modernization.",
      highReliability: "The grid looks stable. Great work balancing supply.",
      lowReliability: "Reliability is dangerously low. Blackouts become likely.",
      neutral: "The grid is in reasonable shape. Keep monitoring reserves.",
    },
  },
  {
    id: "scientist",
    name: "Dr. Priya Rao",
    role: "Climate Scientist",
    emoji: "🌱",
    concern: "We need fewer emissions.",
    reactions: {
      highRenewable: "Excellent! A high renewable mix dramatically cuts our carbon footprint.",
      highFossil: "Too much fossil fuel. We're locking in decades of CO₂ emissions.",
      highPrice: "Carbon pricing is working — but we need to protect low-income families.",
      lowPrice: "Keep prices fair while pushing clean energy forward.",
      highReliability: "Stable grid, clean power. That's the goal.",
      lowReliability: "Unreliable grids often fall back on dirty peaker plants.",
      neutral: "Progress is being made, but we can do better on emissions.",
    },
  },
  {
    id: "economist",
    name: "James Park",
    role: "Economist",
    emoji: "💵",
    concern: "Families can't afford higher bills.",
    reactions: {
      highRenewable: "Renewables have high upfront costs — watch the impact on household bills.",
      highFossil: "Cheap fuel right now, but volatile markets could spike prices anytime.",
      highPrice: "Electricity is already unaffordable for many households. This is a crisis.",
      lowPrice: "Affordable energy is great for consumers and local businesses.",
      highReliability: "Economic productivity depends on reliable power. Well done.",
      lowReliability: "Outages cost businesses billions. This needs to be addressed.",
      neutral: "Energy costs are within acceptable range. Monitor fuel markets.",
    },
  },
  {
    id: "industry",
    name: "Sandra Mills",
    role: "Industry Rep",
    emoji: "🏭",
    concern: "Factories need reliable electricity.",
    reactions: {
      highRenewable: "Intermittency concerns us. Can we get firm power contracts?",
      highFossil: "Reliable, predictable power helps our operations. We appreciate it.",
      highPrice: "These electricity costs are making us uncompetitive. We may move plants.",
      lowPrice: "Lower energy costs help us hire locally and grow.",
      highReliability: "This is exactly what we need. Predictable power keeps production running.",
      lowReliability: "One major outage can cost us millions. This situation is unacceptable.",
      neutral: "Grid is acceptable for our current needs.",
    },
  },
  {
    id: "citizen",
    name: "Maria Torres",
    role: "Resident",
    emoji: "👨‍👩‍👧",
    concern: "My power bill keeps increasing.",
    reactions: {
      highRenewable: "I love clean energy! Though I hope my bill doesn't jump.",
      highFossil: "Are we still burning so much coal? I thought we were past that.",
      highPrice: "I had to choose between groceries and keeping the AC on last month.",
      lowPrice: "Finally some relief on my electricity bill!",
      highReliability: "The lights stayed on all summer. That's all I ask.",
      lowReliability: "My family lost power for three days. It was awful.",
      neutral: "Things seem okay, but I'm watching my bill carefully.",
    },
  },
];

export const US_STATES: StateData[] = [
  {
    id: "TX",
    name: "Texas",
    abbr: "TX",
    population: 31_000_000,
    annualDemandTWh: 480,
    avgPriceCents: 12.1,
    gridScore: 63,
    renewablePct: 29,
    co2Intensity: 390,
    budget: 48,
    challenges: ["Summer peak demand", "Natural gas dependence", "Transmission bottlenecks"],
    mix: { gas: 52, coal: 12, nuclear: 11, wind: 18, solar: 6, hydro: 1 },
    svgPath: "M 180 340 L 280 340 L 290 400 L 240 430 L 180 400 Z",
  },
  {
    id: "CA",
    name: "California",
    abbr: "CA",
    population: 39_500_000,
    annualDemandTWh: 290,
    avgPriceCents: 24.3,
    gridScore: 78,
    renewablePct: 51,
    co2Intensity: 210,
    budget: 52,
    challenges: ["High electricity costs", "Wildfire risk", "Evening demand peak"],
    mix: { gas: 35, coal: 1, nuclear: 9, wind: 11, solar: 26, hydro: 18 },
    svgPath: "M 60 200 L 100 190 L 110 320 L 80 360 L 55 330 Z",
  },
  {
    id: "FL",
    name: "Florida",
    abbr: "FL",
    population: 22_600_000,
    annualDemandTWh: 260,
    avgPriceCents: 13.2,
    gridScore: 55,
    renewablePct: 6,
    co2Intensity: 510,
    budget: 38,
    challenges: ["Hurricane vulnerability", "Low renewable penetration", "Cooling demand"],
    mix: { gas: 71, coal: 9, nuclear: 12, wind: 0, solar: 6, hydro: 2 },
    svgPath: "M 310 380 L 360 380 L 380 440 L 330 460 L 300 420 Z",
  },
  {
    id: "NY",
    name: "New York",
    abbr: "NY",
    population: 19_800_000,
    annualDemandTWh: 165,
    avgPriceCents: 21.4,
    gridScore: 71,
    renewablePct: 33,
    co2Intensity: 280,
    budget: 44,
    challenges: ["Aging infrastructure", "Winter demand peaks", "Offshore wind buildout"],
    mix: { gas: 44, coal: 3, nuclear: 22, wind: 8, solar: 4, hydro: 19 },
    svgPath: "M 380 170 L 440 155 L 450 195 L 400 210 L 375 195 Z",
  },
  {
    id: "IL",
    name: "Illinois",
    abbr: "IL",
    population: 12_600_000,
    annualDemandTWh: 145,
    avgPriceCents: 12.8,
    gridScore: 66,
    renewablePct: 18,
    co2Intensity: 370,
    budget: 36,
    challenges: ["Coal plant retirements", "Nuclear subsidy debate", "Grid congestion"],
    mix: { gas: 28, coal: 24, nuclear: 36, wind: 10, solar: 1, hydro: 1 },
    svgPath: "M 290 230 L 320 228 L 322 295 L 292 296 Z",
  },
  {
    id: "WA",
    name: "Washington",
    abbr: "WA",
    population: 7_700_000,
    annualDemandTWh: 110,
    avgPriceCents: 10.2,
    gridScore: 85,
    renewablePct: 72,
    co2Intensity: 95,
    budget: 32,
    challenges: ["Drought reducing hydro", "Data center demand growth", "Fish habitat concerns"],
    mix: { gas: 10, coal: 6, nuclear: 8, wind: 9, solar: 3, hydro: 64 },
    svgPath: "M 65 115 L 140 110 L 142 155 L 66 158 Z",
  },
  {
    id: "CO",
    name: "Colorado",
    abbr: "CO",
    population: 5_800_000,
    annualDemandTWh: 75,
    avgPriceCents: 13.9,
    gridScore: 68,
    renewablePct: 36,
    co2Intensity: 330,
    budget: 28,
    challenges: ["Coal community transition", "Mountain transmission", "Growing demand"],
    mix: { gas: 36, coal: 22, nuclear: 0, wind: 25, solar: 11, hydro: 6 },
    svgPath: "M 165 255 L 235 253 L 237 295 L 166 297 Z",
  },
  {
    id: "GA",
    name: "Georgia",
    abbr: "GA",
    population: 10_900_000,
    annualDemandTWh: 155,
    avgPriceCents: 11.9,
    gridScore: 58,
    renewablePct: 12,
    co2Intensity: 430,
    budget: 34,
    challenges: ["New nuclear construction", "Summer heat extremes", "EV adoption surge"],
    mix: { gas: 53, coal: 17, nuclear: 22, wind: 0, solar: 7, hydro: 1 },
    svgPath: "M 330 320 L 378 318 L 380 360 L 332 362 Z",
  },
];

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: "heatwave",
    title: "Extreme Heat Wave",
    description: "Record temperatures strain the grid as AC usage surges. Demand spikes 18% above forecast.",
    emoji: "🌡️",
    effects: { demandMultiplier: 1.18, reliabilityDelta: -8 },
    year: 2027,
  },
  {
    id: "coal_failure",
    title: "Coal Plant Failure",
    description: "A major coal plant unexpectedly goes offline for emergency maintenance.",
    emoji: "⚠️",
    effects: { coal: -8, reliabilityDelta: -12 },
    year: 2027,
  },
  {
    id: "federal_tax_credits",
    title: "Federal Clean Energy Tax Credits",
    description: "New federal legislation makes solar and wind 20% cheaper to build.",
    emoji: "🏛️",
    effects: { budgetDelta: 6, solar: 3 },
    year: 2027,
  },
  {
    id: "hurricane",
    title: "Major Hurricane",
    description: "A Category 3 hurricane damages coastal transmission infrastructure.",
    emoji: "🌀",
    effects: { reliabilityDelta: -15, budgetDelta: -5 },
    year: 2028,
  },
  {
    id: "battery_breakthrough",
    title: "Battery Storage Breakthrough",
    description: "Grid-scale battery costs drop 40%, dramatically improving storage economics.",
    emoji: "🔋",
    effects: { budgetDelta: 4, solar: 5, wind: 5 },
    year: 2028,
  },
  {
    id: "gas_shortage",
    title: "Natural Gas Supply Crunch",
    description: "Pipeline disruption cuts gas supply. Gas prices triple for 6 months.",
    emoji: "📉",
    effects: { budgetDelta: -8, priceMultiplier: 1.15 },
    year: 2028,
  },
  {
    id: "nuclear_maintenance",
    title: "Nuclear Maintenance Outage",
    description: "Planned maintenance takes two reactors offline for 3 months.",
    emoji: "🔧",
    effects: { nuclear: -6, reliabilityDelta: -6 },
    year: 2029,
  },
  {
    id: "wildfire",
    title: "Wildfire Transmission Damage",
    description: "Wildfires destroy key transmission lines, isolating parts of the grid.",
    emoji: "🔥",
    effects: { reliabilityDelta: -10, budgetDelta: -4 },
    year: 2029,
  },
  {
    id: "economic_boom",
    title: "Economic Boom",
    description: "A wave of new factories and data centers pushes electricity demand up 12%.",
    emoji: "📈",
    effects: { demandMultiplier: 1.12, budgetDelta: 5 },
    year: 2029,
  },
  {
    id: "recession",
    title: "Economic Recession",
    description: "Industrial slowdown reduces electricity demand by 8%.",
    emoji: "📊",
    effects: { demandMultiplier: 0.92 },
    year: 2030,
  },
];

export function calcGridStats(mix: Record<EnergySourceId, number>) {
  const BASE_PRICE = 12.7;
  let co2 = 0;
  let price = 0;
  let totalPct = 0;
  let renewablePct = 0;
  let reliability = 0;
  let approval = 0;

  for (const src of ENERGY_SOURCES) {
    const pct = mix[src.id] ?? 0;
    if (pct === 0) continue;
    const weight = pct / 100;
    co2 += src.co2 * weight;
    price += src.costMultiplier * weight;
    reliability += src.reliabilityScore * weight;
    approval += src.publicApproval * weight;
    if (src.isRenewable) renewablePct += pct;
    totalPct += pct;
  }

  const effectivePrice = BASE_PRICE * (totalPct > 0 ? price : 1);
  const co2Score = Math.max(0, Math.min(100, ((800 - co2) / 800) * 100));
  const priceScore = Math.max(0, Math.min(100, ((25 - effectivePrice) / 15) * 100));
  const renewScore = Math.min(100, renewablePct);
  const reliabilityScore = Math.min(100, reliability);
  const approvalScore = Math.min(100, approval);

  const overallScore = Math.round(
    co2Score * 0.3 + renewScore * 0.2 + priceScore * 0.2 + reliabilityScore * 0.2 + approvalScore * 0.1
  );

  const grade =
    overallScore >= 90 ? "A+" :
    overallScore >= 80 ? "A" :
    overallScore >= 70 ? "B" :
    overallScore >= 60 ? "C" :
    overallScore >= 50 ? "D" : "F";

  return {
    co2,
    price: effectivePrice,
    renewablePct,
    reliability: reliabilityScore,
    approval: approvalScore,
    totalPct,
    co2Score: Math.round(co2Score),
    priceScore: Math.round(priceScore),
    renewScore: Math.round(renewScore),
    overallScore,
    grade,
  };
}

export function getAdvisorReaction(advisor: Advisor, stats: ReturnType<typeof calcGridStats>): string {
  if (stats.renewablePct >= 60) return advisor.reactions.highRenewable;
  if (stats.renewablePct <= 15 && stats.co2 > 500) return advisor.reactions.highFossil;
  if (stats.price >= 20) return advisor.reactions.highPrice;
  if (stats.price <= 10) return advisor.reactions.lowPrice;
  if (stats.reliability >= 80) return advisor.reactions.highReliability;
  if (stats.reliability <= 55) return advisor.reactions.lowReliability;
  return advisor.reactions.neutral;
}

export type GamePhase = "landing" | "region" | "advisors" | "playing" | "event" | "report";

export interface GameState {
  phase: GamePhase;
  region: StateData | null;
  year: number;
  mix: Record<EnergySourceId, number>;
  budget: number;
  budgetSpent: number;
  reliability: number;
  pendingEvent: GameEvent | null;
  seenEventIds: string[];
  blackoutCount: number;
  yearHistory: Array<{ year: number; stats: ReturnType<typeof calcGridStats> }>;
}

export function initialGameState(): GameState {
  return {
    phase: "landing",
    region: null,
    year: 2026,
    mix: { gas: 0, coal: 0, nuclear: 0, wind: 0, solar: 0, hydro: 0 },
    budget: 0,
    budgetSpent: 0,
    reliability: 80,
    pendingEvent: null,
    seenEventIds: [],
    blackoutCount: 0,
    yearHistory: [],
  };
}
