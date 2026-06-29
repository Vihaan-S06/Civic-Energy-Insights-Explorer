import { Router } from "express";

const router = Router();

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeJoinCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60_000).toISOString();
}

interface Activity {
  id: string;
  text: string;
  timestamp: string;
  type: "pledge" | "simulator" | "join" | "achievement" | "share";
}

interface Team {
  id: string;
  name: string;
  type: string;
  city: string | null;
  description: string | null;
  memberCount: number;
  points: number;
  estimatedCo2TonsSaved: number;
  joinCode: string;
  missionsCompleted: number;
  recentActivity: Activity[];
}

const CAMPAIGN_GOAL_CO2_TONS = 100;
const CAMPAIGN_START = "2026-07-01";
const CAMPAIGN_END = "2026-07-31";

const store: { teams: Team[]; totalSimulatorSubmissions: number } = {
  totalSimulatorSubmissions: 47,
  teams: [
    {
      id: "team-001",
      name: "Green Campus Club",
      type: "Club",
      city: "Berkeley, CA",
      description: "UC Berkeley student sustainability club championing clean energy on campus.",
      memberCount: 67,
      points: 15200,
      estimatedCo2TonsSaved: 15.2,
      joinCode: "GRN42",
      missionsCompleted: 60,
      recentActivity: [
        { id: "a1", text: "Priya completed a 100% renewable grid simulation.", timestamp: minutesAgo(8), type: "simulator" },
        { id: "a2", text: "Marcus pledged to reduce peak-hour electricity usage.", timestamp: minutesAgo(22), type: "pledge" },
        { id: "a3", text: "Green Campus Club earned the Clean Energy Champion badge.", timestamp: minutesAgo(45), type: "achievement" },
      ],
    },
    {
      id: "team-002",
      name: "Mesa Verde Neighborhood Council",
      type: "Neighborhood",
      city: "Phoenix, AZ",
      description: "Neighbors working together to cut household emissions across our community.",
      memberCount: 55,
      points: 13780,
      estimatedCo2TonsSaved: 13.8,
      joinCode: "MVD91",
      missionsCompleted: 52,
      recentActivity: [
        { id: "b1", text: "Linda shared a custom grid scoring an A.", timestamp: minutesAgo(15), type: "share" },
        { id: "b2", text: "James pledged to switch to LED bulbs.", timestamp: minutesAgo(38), type: "pledge" },
        { id: "b3", text: "Daniel joined Mesa Verde Neighborhood Council.", timestamp: minutesAgo(52), type: "join" },
      ],
    },
    {
      id: "team-003",
      name: "Naperville Central High School",
      type: "School",
      city: "Naperville, IL",
      description: "Environmental science students competing to design the cleanest possible grid.",
      memberCount: 48,
      points: 12420,
      estimatedCo2TonsSaved: 12.4,
      joinCode: "NCS77",
      missionsCompleted: 44,
      recentActivity: [
        { id: "c1", text: "Ms. Chen's class submitted a 78% renewable grid.", timestamp: minutesAgo(5), type: "simulator" },
        { id: "c2", text: "Naperville Central moved into 3rd place.", timestamp: minutesAgo(30), type: "achievement" },
        { id: "c3", text: "Tyler pledged to wash clothes with cold water.", timestamp: minutesAgo(71), type: "pledge" },
      ],
    },
    {
      id: "team-004",
      name: "Roosevelt Middle School",
      type: "School",
      city: "New York, NY",
      description: "7th and 8th graders learning about clean energy through friendly competition.",
      memberCount: 41,
      points: 11050,
      estimatedCo2TonsSaved: 11.1,
      joinCode: "RMS55",
      missionsCompleted: 38,
      recentActivity: [
        { id: "d1", text: "Aisha pledged to reduce thermostat by 2°F.", timestamp: minutesAgo(19), type: "pledge" },
        { id: "d2", text: "Roosevelt Middle submitted a 65% renewable scenario.", timestamp: minutesAgo(44), type: "simulator" },
        { id: "d3", text: "9 new members joined Roosevelt Middle School.", timestamp: minutesAgo(90), type: "join" },
      ],
    },
    {
      id: "team-005",
      name: "Lincoln Park Neighbors",
      type: "Neighborhood",
      city: "Chicago, IL",
      description: "Chicago neighborhood committed to reducing our collective carbon footprint.",
      memberCount: 34,
      points: 9870,
      estimatedCo2TonsSaved: 9.9,
      joinCode: "LPN34",
      missionsCompleted: 32,
      recentActivity: [
        { id: "e1", text: "Sarah pledged to turn off unused electronics.", timestamp: minutesAgo(12), type: "pledge" },
        { id: "e2", text: "Lincoln Park Neighbors earned the Community Leader badge.", timestamp: minutesAgo(60), type: "achievement" },
        { id: "e3", text: "Kevin shared a solar-heavy grid scenario.", timestamp: minutesAgo(88), type: "share" },
      ],
    },
    {
      id: "team-006",
      name: "Sunset District Community Group",
      type: "Community Group",
      city: "San Francisco, CA",
      description: "SF residents exploring how our local grid choices affect global climate.",
      memberCount: 29,
      points: 8100,
      estimatedCo2TonsSaved: 8.1,
      joinCode: "SDC19",
      missionsCompleted: 24,
      recentActivity: [
        { id: "f1", text: "Emma pledged to use public transit instead of driving.", timestamp: minutesAgo(27), type: "pledge" },
        { id: "f2", text: "Raj completed a Deep Dive on solar energy sources.", timestamp: minutesAgo(55), type: "pledge" },
      ],
    },
    {
      id: "team-007",
      name: "Troop 247",
      type: "Scout Troop",
      city: "Austin, TX",
      description: "Eagle Scout candidates earning environmental stewardship badges.",
      memberCount: 22,
      points: 7340,
      estimatedCo2TonsSaved: 7.3,
      joinCode: "T247X",
      missionsCompleted: 18,
      recentActivity: [
        { id: "g1", text: "Scout leader Michael submitted a wind-heavy Texas grid.", timestamp: minutesAgo(35), type: "simulator" },
        { id: "g2", text: "Olivia pledged to plant a tree this month.", timestamp: minutesAgo(67), type: "pledge" },
      ],
    },
    {
      id: "team-008",
      name: "Brooklyn Clean Energy Circle",
      type: "Club",
      city: "Brooklyn, NY",
      description: "Young professionals in Brooklyn learning about and advocating for clean energy.",
      memberCount: 18,
      points: 5640,
      estimatedCo2TonsSaved: 5.6,
      joinCode: "BKL08",
      missionsCompleted: 12,
      recentActivity: [
        { id: "h1", text: "Jordan pledged to switch to an EV by end of year.", timestamp: minutesAgo(42), type: "pledge" },
        { id: "h2", text: "Brooklyn Clean Energy Circle completed their first simulation.", timestamp: minutesAgo(95), type: "simulator" },
      ],
    },
  ],
};

function getRankedTeams(): (Team & { rank: number })[] {
  return [...store.teams]
    .sort((a, b) => b.points - a.points)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

function getTeamRank(teamId: string): number {
  return getRankedTeams().find((t) => t.id === teamId)?.rank ?? 99;
}

router.get("/challenge/stats", (_req, res) => {
  const totalParticipants = store.teams.reduce((s, t) => s + t.memberCount, 0);
  const estimatedCo2TonsSaved = parseFloat(
    store.teams.reduce((s, t) => s + t.estimatedCo2TonsSaved, 0).toFixed(1)
  );
  res.json({
    totalParticipants,
    totalTeams: store.teams.length,
    estimatedCo2TonsSaved,
    totalSimulatorSubmissions: store.totalSimulatorSubmissions,
  });
});

router.get("/challenge/leaderboard", (_req, res) => {
  const ranked = getRankedTeams().map(({ id, name, type, city, memberCount, points, estimatedCo2TonsSaved, joinCode, rank, missionsCompleted }) => ({
    rank, id, name, type, city: city ?? null, memberCount, points, estimatedCo2TonsSaved, joinCode, missionsCompleted,
  }));
  res.json(ranked);
});

router.get("/challenge/campaign", (_req, res) => {
  const now = new Date();
  const end = new Date(CAMPAIGN_END + "T23:59:59Z");
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
  const totalCo2 = parseFloat(store.teams.reduce((s, t) => s + t.estimatedCo2TonsSaved, 0).toFixed(1));
  const progressPercent = Math.min(100, (totalCo2 / CAMPAIGN_GOAL_CO2_TONS) * 100);

  res.json({
    id: "july-2026-peak-hours",
    title: "Reduce Peak-Hour Energy",
    description: "Peak hours (4–9 PM) strain the grid and bring the dirtiest, most expensive power plants online. This July, we're challenging communities to shift energy use to off-peak times and cut emissions together.",
    emoji: "⚡",
    startDate: CAMPAIGN_START,
    endDate: CAMPAIGN_END,
    bonusMultiplier: 2,
    badgeLabel: "2× POINTS",
    progressPercent: parseFloat(progressPercent.toFixed(1)),
    goalCo2Tons: CAMPAIGN_GOAL_CO2_TONS,
    currentCo2Tons: totalCo2,
    daysRemaining,
  });
});

router.get("/challenge/feed", (_req, res) => {
  const items: Array<{ id: string; text: string; timestamp: string; type: string; teamName: string }> = [];
  for (const team of store.teams) {
    for (const act of team.recentActivity) {
      items.push({ ...act, teamName: team.name });
    }
  }
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(items.slice(0, 20));
});

router.post("/challenge/team", (req, res) => {
  const { name, type, city, description } = req.body as { name: string; type: string; city?: string; description?: string };
  if (!name || !type) {
    res.status(400).json({ error: "name and type are required" });
    return;
  }
  const team: Team = {
    id: `team-${makeId()}`,
    name,
    type,
    city: city ?? null,
    description: description ?? null,
    memberCount: 1,
    points: 150,
    estimatedCo2TonsSaved: 0.15,
    joinCode: makeJoinCode(),
    missionsCompleted: 0,
    recentActivity: [
      { id: makeId(), text: `${name} was created and joined the challenge!`, timestamp: new Date().toISOString(), type: "join" },
    ],
  };
  store.teams.push(team);
  const rank = getTeamRank(team.id);
  res.status(201).json({ ...team, rank });
});

router.post("/challenge/join", (req, res) => {
  const { joinCode, memberName } = req.body as { joinCode: string; memberName?: string };
  if (!joinCode) {
    res.status(400).json({ error: "joinCode is required" });
    return;
  }
  const team = store.teams.find((t) => t.joinCode.toUpperCase() === joinCode.toUpperCase().trim());
  if (!team) {
    res.status(404).json({ error: "Team not found. Check your join code and try again." });
    return;
  }
  team.memberCount += 1;
  team.points += 50;
  team.estimatedCo2TonsSaved = parseFloat((team.estimatedCo2TonsSaved + 0.05).toFixed(2));
  const actorName = memberName?.trim() || "A new member";
  team.recentActivity.unshift({ id: makeId(), text: `${actorName} joined ${team.name}.`, timestamp: new Date().toISOString(), type: "join" });
  if (team.recentActivity.length > 5) team.recentActivity.length = 5;
  const rank = getTeamRank(team.id);
  res.json({ ...team, rank });
});

router.post("/challenge/pledge", (req, res) => {
  const { teamId, pledgeId: _pledgeId, pledgeName, co2KgSaved, pointsToAward } = req.body as {
    teamId: string; pledgeId: string; pledgeName: string; co2KgSaved: number; pointsToAward?: number;
  };
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const pointsAwarded = typeof pointsToAward === "number" && pointsToAward > 0 ? pointsToAward : 75;
  team.points += pointsAwarded;
  team.estimatedCo2TonsSaved = parseFloat((team.estimatedCo2TonsSaved + co2KgSaved / 1000).toFixed(2));
  team.missionsCompleted += 1;
  team.recentActivity.unshift({
    id: makeId(),
    text: `Someone pledged to ${pledgeName.toLowerCase()}.`,
    timestamp: new Date().toISOString(),
    type: "pledge",
  });
  if (team.recentActivity.length > 5) team.recentActivity.length = 5;
  const rank = getTeamRank(team.id);
  res.json({ pointsAwarded, totalPoints: team.points, newRank: rank, estimatedCo2TonsSaved: team.estimatedCo2TonsSaved, missionsCompleted: team.missionsCompleted });
});

router.post("/challenge/simulator-submission", (req, res) => {
  const { teamId, gridScore, renewablePercent, action } = req.body as {
    teamId: string; gridScore: number; renewablePercent: number; action?: string;
  };
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const pointsAwarded = 100;
  team.points += pointsAwarded;
  store.totalSimulatorSubmissions += 1;
  const desc = action ?? `a ${Math.round(renewablePercent)}% renewable grid scoring ${Math.round(gridScore)}/100`;
  team.recentActivity.unshift({
    id: makeId(),
    text: `Team submitted ${desc}.`,
    timestamp: new Date().toISOString(),
    type: "simulator",
  });
  if (team.recentActivity.length > 5) team.recentActivity.length = 5;
  const rank = getTeamRank(team.id);
  const unlockedBadge = gridScore >= 90 ? "Master Grid Designer" : null;
  res.json({ pointsAwarded, totalPoints: team.points, newRank: rank, unlockedBadge });
});

export default router;
