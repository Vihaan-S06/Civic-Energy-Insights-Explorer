import { Router } from "express";

const router = Router();

const REGIONS = [
  { code: "US", name: "United States (National)", type: "national" },
  { code: "CA", name: "California", type: "state" },
  { code: "TX", name: "Texas", type: "state" },
  { code: "NY", name: "New York", type: "state" },
  { code: "FL", name: "Florida", type: "state" },
  { code: "WA", name: "Washington", type: "state" },
  { code: "WECC", name: "Western Grid (WECC)", type: "grid" },
  { code: "ERCOT", name: "Texas Grid (ERCOT)", type: "grid" },
  { code: "PJM", name: "Mid-Atlantic Grid (PJM)", type: "grid" },
] as const;

type RegionCode = (typeof REGIONS)[number]["code"];

const OVERVIEW_DATA: Record<string, object> = {
  US: {
    region: "US",
    regionName: "United States (National)",
    totalGenerationGWh: 4243000,
    renewablePercent: 21.5,
    fossilPercent: 60.2,
    nuclearPercent: 18.3,
    co2IntensityGPerKWh: 386,
    averageRetailPriceCentsPerKWh: 12.7,
    totalConsumersMillions: 150.8,
    headline: "About 1 in 5 kilowatt-hours now comes from clean energy — but fossil fuels still run the show.",
    summary:
      "The US generated about 4.2 trillion kilowatt-hours of electricity last year. While solar and wind are growing fast, natural gas and coal still produce most of our power. For every kilowatt-hour you use, the grid releases about 386 grams of CO2 — roughly the weight of two iPhone 15s.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 3.8,
  },
  CA: {
    region: "CA",
    regionName: "California",
    totalGenerationGWh: 285000,
    renewablePercent: 52.4,
    fossilPercent: 27.1,
    nuclearPercent: 8.9,
    co2IntensityGPerKWh: 196,
    averageRetailPriceCentsPerKWh: 27.9,
    totalConsumersMillions: 15.3,
    headline: "More than half of California's electricity now comes from clean sources — a first for a major US state.",
    summary:
      "California leads the nation in clean energy, with solar alone powering roughly 1 in 4 homes on sunny days. The tradeoff: electricity here costs more than twice the national average. The state still leans on natural gas when the sun goes down and demand spikes.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 8.2,
  },
  TX: {
    region: "TX",
    regionName: "Texas",
    totalGenerationGWh: 510000,
    renewablePercent: 31.8,
    fossilPercent: 64.7,
    nuclearPercent: 3.5,
    co2IntensityGPerKWh: 421,
    averageRetailPriceCentsPerKWh: 10.2,
    totalConsumersMillions: 12.2,
    headline: "Texas is the top wind power producer in the nation — but natural gas still makes up most of the grid.",
    summary:
      "Texas generates more wind power than any other state, yet its independent power grid (ERCOT) still relies heavily on fossil fuels. Energy is cheap here, but the grid faced severe stress during Winter Storm Uri in 2021 and remains vulnerable to extreme weather events.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 5.1,
  },
  NY: {
    region: "NY",
    regionName: "New York",
    totalGenerationGWh: 136000,
    renewablePercent: 41.2,
    fossilPercent: 31.8,
    nuclearPercent: 27.0,
    co2IntensityGPerKWh: 231,
    averageRetailPriceCentsPerKWh: 21.4,
    totalConsumersMillions: 8.6,
    headline: "New York's grid is cleaner than most — largely thanks to nuclear and hydropower.",
    summary:
      "New York generates a big chunk of its clean electricity from nuclear plants upstate and Niagara Falls hydropower. The state has set an ambitious goal to reach 70% renewable energy by 2030, which would require a major buildout of offshore wind and solar.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 4.5,
  },
  FL: {
    region: "FL",
    regionName: "Florida",
    totalGenerationGWh: 261000,
    renewablePercent: 7.2,
    fossilPercent: 88.1,
    nuclearPercent: 12.3,
    co2IntensityGPerKWh: 498,
    averageRetailPriceCentsPerKWh: 12.1,
    totalConsumersMillions: 10.7,
    headline: "Florida has one of the dirtiest electrical grids in the US — and one of the biggest opportunities to fix it.",
    summary:
      "The Sunshine State generates only about 7% of its electricity from renewables, despite having some of the best solar potential in the country. Natural gas dominates. The good news: solar adoption is accelerating rapidly, and new utility-scale solar projects are coming online every month.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 4.9,
  },
  WA: {
    region: "WA",
    regionName: "Washington",
    totalGenerationGWh: 111000,
    renewablePercent: 77.8,
    fossilPercent: 15.6,
    nuclearPercent: 6.6,
    co2IntensityGPerKWh: 98,
    averageRetailPriceCentsPerKWh: 10.3,
    totalConsumersMillions: 3.7,
    headline: "Washington has some of the cleanest and cheapest electricity in the country, thanks to the Columbia River.",
    summary:
      "Massive hydroelectric dams on the Columbia and Snake Rivers give Washington state an almost entirely clean grid at some of the lowest prices in the nation. Most electricity here comes from falling water — a renewable source that works around the clock, rain or shine.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 1.2,
  },
  WECC: {
    region: "WECC",
    regionName: "Western Grid (WECC)",
    totalGenerationGWh: 1050000,
    renewablePercent: 38.6,
    fossilPercent: 43.2,
    nuclearPercent: 8.1,
    co2IntensityGPerKWh: 271,
    averageRetailPriceCentsPerKWh: 14.8,
    totalConsumersMillions: 81.3,
    headline: "The western grid is transitioning fast — renewables are at an all-time high share.",
    summary:
      "The Western Interconnection connects 1.8 million square miles from Canada to Mexico. It's the most renewable-heavy major grid in the US, powered by California's solar, Pacific Northwest hydro, and a growing fleet of wind turbines across the interior west.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 6.3,
  },
  ERCOT: {
    region: "ERCOT",
    regionName: "Texas Grid (ERCOT)",
    totalGenerationGWh: 510000,
    renewablePercent: 31.8,
    fossilPercent: 64.7,
    nuclearPercent: 3.5,
    co2IntensityGPerKWh: 421,
    averageRetailPriceCentsPerKWh: 10.2,
    totalConsumersMillions: 27.0,
    headline: "ERCOT is America's most isolated grid — and its most wind-powered.",
    summary:
      "Texas runs its own independent power grid, ERCOT, which is not connected to the rest of the US. That independence helps keep prices low but makes it harder to import power during emergencies. Wind turbines now supply about a quarter of all electricity on ERCOT.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 5.1,
  },
  PJM: {
    region: "PJM",
    regionName: "Mid-Atlantic Grid (PJM)",
    totalGenerationGWh: 800000,
    renewablePercent: 11.2,
    fossilPercent: 52.4,
    nuclearPercent: 36.4,
    co2IntensityGPerKWh: 338,
    averageRetailPriceCentsPerKWh: 13.4,
    totalConsumersMillions: 65.0,
    headline: "PJM's heavy reliance on nuclear power keeps its carbon intensity below the national average.",
    summary:
      "PJM serves 65 million people across 13 states from Illinois to New Jersey. Its large fleet of nuclear power plants — the biggest in the US — keeps the grid cleaner than it might otherwise be. But those plants are aging, and replacing them with clean alternatives is the grid's biggest challenge.",
    lastUpdated: new Date().toISOString(),
    trendVsLastYear: 2.8,
  },
};

function getOverviewForRegion(region: string): object {
  return OVERVIEW_DATA[region] ?? OVERVIEW_DATA["US"];
}

const SOURCE_DATA: Record<string, object[]> = {
  US: [
    { source: "natural_gas", label: "Natural Gas", category: "fossil", generationGWh: 1778060, percent: 41.9, co2GPerKWh: 490, plainDescription: "Burns gas to spin turbines — fast and flexible, but releases carbon dioxide and methane.", color: "#f59e0b" },
    { source: "nuclear", label: "Nuclear", category: "nuclear", generationGWh: 778090, percent: 18.3, co2GPerKWh: 12, plainDescription: "Splits atoms to make heat, then electricity. No air pollution, very low carbon, but produces radioactive waste.", color: "#8b5cf6" },
    { source: "coal", label: "Coal", category: "fossil", generationGWh: 771000, percent: 18.2, co2GPerKWh: 820, plainDescription: "Burns crushed rock to make steam. The dirtiest way to make electricity — heavy CO2 and air pollution.", color: "#78716c" },
    { source: "wind", label: "Wind", category: "renewable", generationGWh: 434960, percent: 10.2, co2GPerKWh: 11, plainDescription: "Spinning blades catch moving air to generate power. Zero emissions, but only works when the wind blows.", color: "#06b6d4" },
    { source: "solar", label: "Solar", category: "renewable", generationGWh: 238720, percent: 5.6, co2GPerKWh: 45, plainDescription: "Panels turn sunlight directly into electricity. Fastest-growing energy source — but only works during daylight.", color: "#eab308" },
    { source: "hydro", label: "Hydropower", category: "renewable", generationGWh: 259430, percent: 6.1, co2GPerKWh: 4, plainDescription: "Flowing water spins generators in dams. Reliable and clean, but limited by geography and drought.", color: "#3b82f6" },
    { source: "other_renewables", label: "Other Renewables", category: "renewable", generationGWh: 127290, percent: 3.0, co2GPerKWh: 18, plainDescription: "Includes biomass (burning plant material), geothermal (Earth's heat), and other small clean sources.", color: "#22c55e" },
    { source: "petroleum", label: "Petroleum", category: "fossil", generationGWh: 25380, percent: 0.6, co2GPerKWh: 650, plainDescription: "Burning oil or diesel to make power — expensive and highly polluting. Used mainly as backup.", color: "#dc2626" },
  ],
  CA: [
    { source: "solar", label: "Solar", category: "renewable", generationGWh: 85500, percent: 30.0, co2GPerKWh: 45, plainDescription: "Panels turn sunlight into electricity. California leads the US in solar — on sunny days it powers everything.", color: "#eab308" },
    { source: "natural_gas", label: "Natural Gas", category: "fossil", generationGWh: 77235, percent: 27.1, co2GPerKWh: 490, plainDescription: "Burns gas to spin turbines — still needed when the sun isn't shining.", color: "#f59e0b" },
    { source: "wind", label: "Wind", category: "renewable", generationGWh: 28500, percent: 10.0, co2GPerKWh: 11, plainDescription: "Wind turbines concentrated in the Tehachapi and Altamont passes.", color: "#06b6d4" },
    { source: "nuclear", label: "Nuclear", category: "nuclear", generationGWh: 25365, percent: 8.9, co2GPerKWh: 12, plainDescription: "Diablo Canyon, CA's last nuclear plant, provides steady 24/7 clean power.", color: "#8b5cf6" },
    { source: "hydro", label: "Hydropower", category: "renewable", generationGWh: 34200, percent: 12.0, co2GPerKWh: 4, plainDescription: "Dams in the Sierra Nevada mountains. Drought years reduce output significantly.", color: "#3b82f6" },
    { source: "imports", label: "Imported Power", category: "other", generationGWh: 28500, percent: 10.0, co2GPerKWh: 260, plainDescription: "Electricity bought from other states — a mix of clean and fossil sources.", color: "#94a3b8" },
    { source: "other_renewables", label: "Geothermal & Other", category: "renewable", generationGWh: 5700, percent: 2.0, co2GPerKWh: 38, plainDescription: "California sits on volcanic activity — geothermal taps that underground heat 24/7.", color: "#22c55e" },
  ],
  TX: [
    { source: "natural_gas", label: "Natural Gas", category: "fossil", generationGWh: 229500, percent: 45.0, co2GPerKWh: 490, plainDescription: "Texas has massive gas reserves and pipelines — it's the backbone of the ERCOT grid.", color: "#f59e0b" },
    { source: "wind", label: "Wind", category: "renewable", generationGWh: 127500, percent: 25.0, co2GPerKWh: 11, plainDescription: "The panhandle and west Texas are some of the windiest places in the world. TX leads the US in wind power.", color: "#06b6d4" },
    { source: "coal", label: "Coal", category: "fossil", generationGWh: 102000, percent: 20.0, co2GPerKWh: 820, plainDescription: "Texas still runs several coal plants, though many are retiring as wind and gas become cheaper.", color: "#78716c" },
    { source: "nuclear", label: "Nuclear", category: "nuclear", generationGWh: 17850, percent: 3.5, co2GPerKWh: 12, plainDescription: "Comanche Peak plant in Glen Rose provides steady baseload power.", color: "#8b5cf6" },
    { source: "solar", label: "Solar", category: "renewable", generationGWh: 35700, percent: 7.0, co2GPerKWh: 45, plainDescription: "Solar is booming in Texas — massive utility-scale farms are coming online rapidly.", color: "#eab308" },
  ],
};

function getSourcesForRegion(region: string): object[] {
  return SOURCE_DATA[region] ?? SOURCE_DATA["US"];
}

function generateTrends(region: string): object[] {
  const baseRenewable: Record<string, number> = { US: 18.0, CA: 44.0, TX: 25.0, NY: 36.0, FL: 3.5, WA: 74.0, WECC: 32.0, ERCOT: 25.0, PJM: 7.0 };
  const baseFossil: Record<string, number> = { US: 64.0, CA: 32.0, TX: 70.0, NY: 36.0, FL: 92.0, WA: 18.0, WECC: 48.0, ERCOT: 70.0, PJM: 55.0 };
  const baseCO2: Record<string, number> = { US: 410, CA: 215, TX: 450, NY: 251, FL: 530, WA: 105, WECC: 291, ERCOT: 450, PJM: 360 };
  const baseTotal: Record<string, number> = { US: 390000, CA: 26000, TX: 46000, NY: 12000, FL: 23000, WA: 10000, WECC: 95000, ERCOT: 46000, PJM: 72000 };

  const r = baseRenewable[region] ?? baseRenewable["US"];
  const f = baseFossil[region] ?? baseFossil["US"];
  const c = baseCO2[region] ?? baseCO2["US"];
  const t = baseTotal[region] ?? baseTotal["US"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthIdx = d.getMonth();
    const isoMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${months[monthIdx]} ${d.getFullYear()}`;
    const seasonal = 1 + 0.12 * Math.sin((monthIdx / 12) * 2 * Math.PI);
    const trend = 1 + (i / 11) * 0.04;
    const totalGWh = Math.round(t * seasonal);
    const renewablePct = Math.min(r + i * 0.25, 100);
    const renewableGWh = Math.round((totalGWh * renewablePct) / 100);
    const nuclearPct = 20 - f / 5;
    const nuclearGWh = Math.round((totalGWh * Math.max(nuclearPct, 0)) / 100);
    const fossilGWh = Math.max(totalGWh - renewableGWh - nuclearGWh, 0);
    const co2 = Math.round(c * (1 - (i / 11) * 0.04) / trend);

    return {
      month: isoMonth,
      label,
      totalGWh,
      renewableGWh,
      fossilGWh,
      nuclearGWh,
      co2IntensityGPerKWh: co2,
      renewablePercent: Math.round(renewablePct * 10) / 10,
      lastUpdated: new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });
}

const ALERTS: Record<string, object[]> = {
  US: [
    {
      id: "alert-co2-high",
      severity: "warning",
      title: "Emissions Up During Summer Heat Wave",
      plainMessage: "Unusually hot temperatures are causing people to run air conditioners at record levels. This is forcing power companies to fire up older, dirtier coal and gas plants that are usually kept on standby. Your electricity is leaving a larger carbon footprint than usual this month.",
      category: "emissions",
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      region: "US",
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      actionTip: "Raise your thermostat by 2-3 degrees when you're away or sleeping. It saves money and takes pressure off the grid.",
    },
    {
      id: "alert-coal-retiring",
      severity: "info",
      title: "5 Coal Plants Closing This Year",
      plainMessage: "Five more coal power plants across the US are scheduled to shut down permanently in the coming months. This is good news for air quality and climate — coal is the dirtiest way to make electricity. Natural gas and renewables will pick up the slack.",
      category: "supply",
      issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      region: "US",
      expiresAt: null,
      actionTip: null,
    },
    {
      id: "alert-solar-record",
      severity: "info",
      title: "Solar Power Just Set a New Record",
      plainMessage: "Last week, solar panels across the US produced more electricity in a single hour than ever before. On a sunny afternoon, solar briefly powered about 8% of the entire country's needs — a milestone that would have seemed impossible just five years ago.",
      category: "grid",
      issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      region: "US",
      expiresAt: null,
      actionTip: "Consider signing up for a solar community program — you don't need rooftop panels to benefit from solar power.",
    },
  ],
  TX: [
    {
      id: "ercot-stress",
      severity: "warning",
      title: "Grid Stress Alert: High Demand Period",
      plainMessage: "ERCOT is asking Texans to voluntarily reduce electricity use between 3 PM and 8 PM today. The grid is under strain because temperatures are high and several power plants are offline for maintenance. You probably won't lose power, but every bit of conservation helps keep the grid stable.",
      category: "reliability",
      issuedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      region: "TX",
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      actionTip: "Set your AC to 78°F, avoid using dishwashers and washing machines in the afternoon, and unplug electronics you're not using.",
    },
    {
      id: "tx-wind-record",
      severity: "info",
      title: "Wind Power Hits All-Time High",
      plainMessage: "Texas wind turbines generated more electricity yesterday than on any previous day in history. Strong winds across the panhandle kept turbines spinning at near-maximum capacity for 18 hours straight, briefly making wind the largest source of electricity in the state.",
      category: "grid",
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      region: "TX",
      expiresAt: null,
      actionTip: null,
    },
  ],
  CA: [
    {
      id: "ca-flex-alert",
      severity: "info",
      title: "Flex Alert Possible This Evening",
      plainMessage: "The California grid operator may issue a Flex Alert asking residents to reduce power use between 4 PM and 9 PM. This happens when solar production drops in the evening (the 'duck curve') and demand is still high. It's normal and manageable — a heads-up so you can plan ahead.",
      category: "reliability",
      issuedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      region: "CA",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      actionTip: "Pre-cool your home in the afternoon, charge your car before 4 PM, and shift laundry and dishwasher use to after 9 PM.",
    },
  ],
  FL: [
    {
      id: "fl-solar-surge",
      severity: "info",
      title: "Florida Solar Growing Rapidly — But Still Far Behind",
      plainMessage: "Florida added more solar panels last year than any year before — but the state still gets only 7% of its power from the sun, despite being called the Sunshine State. Experts say Florida has enough sun to power itself almost entirely from solar if utilities invested in it.",
      category: "supply",
      issuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      region: "FL",
      expiresAt: null,
      actionTip: "Ask your utility about community solar programs — you can pay a slightly lower rate and support new solar projects without installing panels yourself.",
    },
    {
      id: "fl-co2-concern",
      severity: "warning",
      title: "Florida's CO2 Emissions Are Among the Nation's Highest",
      plainMessage: "Each kilowatt-hour of electricity used in Florida releases nearly 500 grams of CO2 — about 30% more than the national average. This is because Florida relies almost entirely on natural gas and has very little renewable energy on its grid. It's not your fault — it's a policy and infrastructure issue.",
      category: "emissions",
      issuedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      region: "FL",
      expiresAt: null,
      actionTip: "Energy efficiency is the fastest way to reduce your carbon footprint right now — LED bulbs, better insulation, and smart thermostats all help.",
    },
  ],
};

const DEFAULT_ALERTS = ALERTS["US"];

function getAlertsForRegion(region: string): object[] {
  return ALERTS[region] ?? DEFAULT_ALERTS;
}

const GENERATION_MIX: Record<string, object> = {
  US: {
    region: "US",
    asOf: new Date().toISOString(),
    totalMW: 485000,
    sources: [
      { source: "natural_gas", label: "Natural Gas", category: "fossil", currentMW: 203250, percent: 41.9, color: "#f59e0b" },
      { source: "nuclear", label: "Nuclear", category: "nuclear", currentMW: 88715, percent: 18.3, color: "#8b5cf6" },
      { source: "coal", label: "Coal", category: "fossil", currentMW: 88270, percent: 18.2, color: "#78716c" },
      { source: "wind", label: "Wind", category: "renewable", currentMW: 49470, percent: 10.2, color: "#06b6d4" },
      { source: "hydro", label: "Hydropower", category: "renewable", currentMW: 29585, percent: 6.1, color: "#3b82f6" },
      { source: "solar", label: "Solar", category: "renewable", currentMW: 27160, percent: 5.6, color: "#eab308" },
      { source: "other", label: "Other", category: "other", currentMW: 14550, percent: 3.0, color: "#22c55e" },
    ],
    gridStatus: "normal",
    gridStatusLabel: "Grid Normal",
    gridStatusExplanation: "Supply and demand are balanced. The grid is running smoothly with no issues expected in the next few hours.",
  },
  TX: {
    region: "TX",
    asOf: new Date().toISOString(),
    totalMW: 58000,
    sources: [
      { source: "natural_gas", label: "Natural Gas", category: "fossil", currentMW: 26100, percent: 45.0, color: "#f59e0b" },
      { source: "wind", label: "Wind", category: "renewable", currentMW: 14500, percent: 25.0, color: "#06b6d4" },
      { source: "coal", label: "Coal", category: "fossil", currentMW: 11600, percent: 20.0, color: "#78716c" },
      { source: "solar", label: "Solar", category: "renewable", currentMW: 4060, percent: 7.0, color: "#eab308" },
      { source: "nuclear", label: "Nuclear", category: "nuclear", currentMW: 2030, percent: 3.5, color: "#8b5cf6" },
    ],
    gridStatus: "stressed",
    gridStatusLabel: "Grid Under Stress",
    gridStatusExplanation: "Demand is higher than expected due to hot temperatures. The grid is stable but has less backup capacity than usual. Conservation helps.",
  },
  CA: {
    region: "CA",
    asOf: new Date().toISOString(),
    totalMW: 32000,
    sources: [
      { source: "solar", label: "Solar", category: "renewable", currentMW: 9600, percent: 30.0, color: "#eab308" },
      { source: "natural_gas", label: "Natural Gas", category: "fossil", currentMW: 8672, percent: 27.1, color: "#f59e0b" },
      { source: "hydro", label: "Hydropower", category: "renewable", currentMW: 3840, percent: 12.0, color: "#3b82f6" },
      { source: "wind", label: "Wind", category: "renewable", currentMW: 3200, percent: 10.0, color: "#06b6d4" },
      { source: "nuclear", label: "Nuclear", category: "nuclear", currentMW: 2848, percent: 8.9, color: "#8b5cf6" },
      { source: "imports", label: "Imported Power", category: "other", currentMW: 3200, percent: 10.0, color: "#94a3b8" },
      { source: "geothermal", label: "Geothermal", category: "renewable", currentMW: 640, percent: 2.0, color: "#22c55e" },
    ],
    gridStatus: "normal",
    gridStatusLabel: "Grid Normal",
    gridStatusExplanation: "Solar output is strong today and the grid is well-supplied. No conservation alerts expected.",
  },
};

function getMixForRegion(region: string): object {
  return GENERATION_MIX[region] ?? GENERATION_MIX["US"];
}

router.get("/regions", (_req, res) => {
  res.json(REGIONS);
});

router.get("/overview", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(getOverviewForRegion(region));
});

router.get("/by-source", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(getSourcesForRegion(region));
});

router.get("/trends", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(generateTrends(region));
});

router.get("/alerts", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(getAlertsForRegion(region));
});

router.get("/generation-mix", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(getMixForRegion(region));
});

export default router;
