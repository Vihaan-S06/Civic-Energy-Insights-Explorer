import { Router } from "express";

const router = Router();

const ALL_REGION_DATA = [
  { region: "US", regionName: "United States (National)", type: "national", renewablePercent: 21.5, co2IntensityGPerKWh: 386, averageRetailPriceCentsPerKWh: 12.7, fossilPercent: 60.2 },
  { region: "CA", regionName: "California", type: "state", renewablePercent: 52.4, co2IntensityGPerKWh: 196, averageRetailPriceCentsPerKWh: 27.9, fossilPercent: 27.1 },
  { region: "TX", regionName: "Texas", type: "state", renewablePercent: 31.8, co2IntensityGPerKWh: 421, averageRetailPriceCentsPerKWh: 10.2, fossilPercent: 64.7 },
  { region: "NY", regionName: "New York", type: "state", renewablePercent: 41.2, co2IntensityGPerKWh: 231, averageRetailPriceCentsPerKWh: 21.4, fossilPercent: 31.8 },
  { region: "FL", regionName: "Florida", type: "state", renewablePercent: 7.2, co2IntensityGPerKWh: 498, averageRetailPriceCentsPerKWh: 12.1, fossilPercent: 88.1 },
  { region: "WA", regionName: "Washington", type: "state", renewablePercent: 77.8, co2IntensityGPerKWh: 98, averageRetailPriceCentsPerKWh: 10.3, fossilPercent: 15.6 },
  { region: "WECC", regionName: "Western Grid (WECC)", type: "grid", renewablePercent: 38.6, co2IntensityGPerKWh: 271, averageRetailPriceCentsPerKWh: 14.8, fossilPercent: 43.2 },
  { region: "ERCOT", regionName: "Texas Grid (ERCOT)", type: "grid", renewablePercent: 31.8, co2IntensityGPerKWh: 421, averageRetailPriceCentsPerKWh: 10.2, fossilPercent: 64.7 },
  { region: "PJM", regionName: "Mid-Atlantic Grid (PJM)", type: "grid", renewablePercent: 11.2, co2IntensityGPerKWh: 338, averageRetailPriceCentsPerKWh: 13.4, fossilPercent: 52.4 },
];

type RecommendationCategory = "solar" | "efficiency" | "advocacy" | "policy" | "community" | "grid";

interface Recommendation {
  id: string;
  priority: number;
  title: string;
  description: string;
  category: RecommendationCategory;
  icon: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
  recipient: string;
}

function buildRecommendations(region: string) {
  const data = ALL_REGION_DATA.find((r) => r.region === region) ?? ALL_REGION_DATA[0]!;
  const { renewablePercent, co2IntensityGPerKWh, averageRetailPriceCentsPerKWh, fossilPercent, regionName } = data;

  const recs: Recommendation[] = [];

  if (fossilPercent > 70) {
    recs.push({
      id: "community-solar",
      priority: 1,
      title: "Sign Up for Community Solar",
      description: `${regionName} gets ${fossilPercent.toFixed(0)}% of its power from fossil fuels. Community solar programs let you pay for clean energy without installing panels — often at a discount to your current bill. Ask your utility if one exists in your area.`,
      category: "solar",
      icon: "Sun",
    });
  }

  if (renewablePercent < 20) {
    recs.push({
      id: "contact-utility",
      priority: 2,
      title: "Ask Your Utility About Renewable Targets",
      description: `Only ${renewablePercent.toFixed(0)}% of ${regionName}'s electricity comes from clean sources — well below the national average. Many utilities respond to customer pressure. A simple email asking about their renewable energy roadmap signals that customers care.`,
      category: "advocacy",
      icon: "Mail",
    });
  }

  if (co2IntensityGPerKWh > 400) {
    recs.push({
      id: "efficiency-appliances",
      priority: renewablePercent < 20 ? 3 : 1,
      title: "Reduce Your Carbon Footprint Through Efficiency",
      description: `Every kWh you save in ${regionName} avoids ${co2IntensityGPerKWh}g of CO₂ — one of the highest rates in the country. The fastest wins: switch to LED lighting, unplug idle electronics, and use a smart power strip. These changes also cut your bill.`,
      category: "efficiency",
      icon: "Zap",
    });
  }

  if (averageRetailPriceCentsPerKWh > 18) {
    recs.push({
      id: "time-of-use",
      priority: recs.length + 1,
      title: "Switch to a Time-of-Use Rate Plan",
      description: `At ${averageRetailPriceCentsPerKWh}¢/kWh, ${regionName} has above-average electricity prices. Many utilities offer time-of-use plans that charge less when demand is low — typically late at night and early morning. Shifting your dishwasher, laundry, and EV charging to off-peak hours can cut your bill 15–25%.`,
      category: "efficiency",
      icon: "Clock",
    });
  }

  if (renewablePercent > 40) {
    recs.push({
      id: "ev-adoption",
      priority: recs.length + 1,
      title: "Switch to an Electric Vehicle",
      description: `With ${renewablePercent.toFixed(0)}% renewable electricity, ${regionName}'s grid is clean enough that driving an EV is significantly better for the climate than a gas car — and the advantage grows every year as the grid gets cleaner.`,
      category: "community",
      icon: "Car",
    });
  }

  recs.push({
    id: "advocate-policy",
    priority: recs.length + 1,
    title: "Contact Your Elected Officials",
    description: `Energy policy is set by local and state government. A short, personal email to your city council member or state representative about clean energy goals has more impact than you might think — especially when officials hear from many constituents.`,
    category: "policy",
    icon: "Users",
  });

  recs.push({
    id: "school-solar",
    priority: recs.length + 1,
    title: "Support Solar at Local Schools",
    description: `School solar projects reduce utility bills that would otherwise come from education budgets — and they teach students about clean energy firsthand. Many school districts are open to proposals from community members. Find out if yours has a sustainability plan.`,
    category: "community",
    icon: "School",
  });

  recs.sort((a, b) => a.priority - b.priority);

  const topIssue =
    fossilPercent > 70
      ? "Heavy fossil fuel dependence"
      : co2IntensityGPerKWh > 400
      ? "High carbon intensity"
      : renewablePercent < 20
      ? "Low renewable energy share"
      : averageRetailPriceCentsPerKWh > 18
      ? "High electricity prices"
      : "Continued grid modernization";

  const topIssueExplanation =
    fossilPercent > 70
      ? `${regionName} generates ${fossilPercent.toFixed(0)}% of its electricity from coal and natural gas. This is above the national average and means residents' electricity contributes heavily to carbon emissions.`
      : co2IntensityGPerKWh > 400
      ? `For every kilowatt-hour used in ${regionName}, ${co2IntensityGPerKWh}g of CO₂ is released — about ${Math.round((co2IntensityGPerKWh / 386) * 100 - 100)}% more than the US average.`
      : renewablePercent < 20
      ? `Only ${renewablePercent.toFixed(0)}% of ${regionName}'s power comes from clean sources like wind and solar, despite significant renewable potential in the region.`
      : averageRetailPriceCentsPerKWh > 18
      ? `Residents in ${regionName} pay ${averageRetailPriceCentsPerKWh}¢ per kWh — ${Math.round((averageRetailPriceCentsPerKWh / 12.7) * 100 - 100)}% more than the national average of 12.7¢.`
      : `${regionName} has made real progress on clean energy. The next step is maintaining momentum and pushing for even more ambitious targets.`;

  const emailTemplates: EmailTemplate[] = [
    {
      recipient: "City Council",
      subject: `Request for Clean Energy Commitment in ${regionName}`,
      body: `Dear Council Member,

I am a resident of ${regionName} writing to request that our city council take action on clean energy.

Currently, ${regionName} generates only ${renewablePercent.toFixed(0)}% of its electricity from renewable sources, with ${co2IntensityGPerKWh}g of CO₂ released per kilowatt-hour — ${co2IntensityGPerKWh > 386 ? "above" : "below"} the national average.

I am asking the council to:
1. Set a formal clean energy or emissions reduction target for our community
2. Explore community solar programs for residents who cannot install rooftop panels
3. Work with our local utility on a renewable energy roadmap

Thank you for your service to our community. I look forward to hearing your thoughts on this important issue.

Sincerely,
[Your Name]
[Your Address]`,
    },
    {
      recipient: "Utility Company",
      subject: `Customer Request: Renewable Energy Roadmap for ${regionName}`,
      body: `Dear Customer Service,

I am a customer in your service area in ${regionName} writing to ask about your plans for increasing renewable energy.

I understand that ${regionName} currently receives ${renewablePercent.toFixed(0)}% of its electricity from clean sources. As a customer, I would like to know:

1. What is your target for renewable energy generation over the next 5–10 years?
2. Do you offer or plan to offer a community solar program?
3. What options exist for customers who want to support renewable energy directly?

Clean energy is important to me, and I believe it should be a priority for our utility.

Thank you,
[Your Name]
Account #: [Your Account Number]`,
    },
    {
      recipient: "State Representative",
      subject: `Constituent Request: State Clean Energy Policy in ${regionName}`,
      body: `Dear Representative,

I am a constituent writing to express my support for stronger clean energy policies in our state.

${regionName}'s electric grid currently produces ${co2IntensityGPerKWh}g of CO₂ per kilowatt-hour, and only ${renewablePercent.toFixed(0)}% of our power comes from renewable sources. I believe we can and should do better.

I am asking you to support:
1. A stronger renewable portfolio standard for our state
2. Incentives for residential and community solar installation
3. Grid modernization investments to support more clean energy

This is an issue that matters deeply to me and to many of your constituents. I would welcome the opportunity to discuss it further.

Respectfully,
[Your Name]
[Your City, State]`,
    },
  ];

  return {
    region: data.region,
    regionName: data.regionName,
    topIssue,
    topIssueExplanation,
    recommendations: recs,
    emailTemplates,
  };
}

router.get("/recommendations", (req, res) => {
  const region = typeof req.query["region"] === "string" ? req.query["region"] : "US";
  res.json(buildRecommendations(region));
});

router.get("/rankings", (_req, res) => {
  const entries = ALL_REGION_DATA.map((r) => ({ ...r }));

  const byRenewables = [...entries]
    .sort((a, b) => b.renewablePercent - a.renewablePercent)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const byCO2 = [...entries]
    .sort((a, b) => a.co2IntensityGPerKWh - b.co2IntensityGPerKWh)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const byPrice = [...entries]
    .sort((a, b) => a.averageRetailPriceCentsPerKWh - b.averageRetailPriceCentsPerKWh)
    .map((r, i) => ({ rank: i + 1, ...r }));

  res.json({ byRenewables, byCO2, byPrice });
});

export default router;
