import { Router } from "express";

const router = Router();

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type MissionDifficulty = "Easy" | "Medium" | "Hard" | "Expert";
type EvidenceType = "none" | "photo" | "screenshot" | "reflection" | "quiz";
type SubmissionStatus = "pending" | "approved" | "rejected";
type EventStatus = "active" | "closed";

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  xp: number;
  co2SavedKg: number;
  requiresEvidence: boolean;
  evidenceType: EvidenceType;
  category: string;
  estimatedMinutes: number;
}

interface EventMission extends MissionTemplate {
  bonusMultiplier: number;
  isFlash: boolean;
  flashExpiresAt: string | null;
  deadline: string | null;
}

interface EventParticipant {
  id: string;
  name: string;
  teamName: string | null;
  xp: number;
  joinedAt: string;
  completedMissionIds: string[];
}

interface Submission {
  id: string;
  participantId: string;
  participantName: string;
  missionId: string;
  missionTitle: string;
  status: SubmissionStatus;
  evidence: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  feedback: string | null;
}

interface ChallengeEvent {
  id: string;
  name: string;
  host: string;
  description: string;
  goal: string;
  joinCode: string;
  organizerCode: string;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  status: EventStatus;
  missions: EventMission[];
  participants: EventParticipant[];
  submissions: Submission[];
  createdAt: string;
}

export const MISSION_LIBRARY: MissionTemplate[] = [
  { id: "lib-001", title: "Turn Off the Lights", description: "Go one full day only using natural light during daylight hours and turning off all lights when leaving a room.", difficulty: "Easy", xp: 50, co2SavedKg: 1.2, requiresEvidence: false, evidenceType: "none", category: "Home Energy", estimatedMinutes: 0 },
  { id: "lib-002", title: "Bike or Walk Instead of Drive", description: "Complete one commute or errand by bike or on foot instead of using a car.", difficulty: "Medium", xp: 100, co2SavedKg: 3.6, requiresEvidence: false, evidenceType: "none", category: "Transportation", estimatedMinutes: 30 },
  { id: "lib-003", title: "Complete a Grid Simulator Scenario", description: "Build a grid on the Energy Simulator that scores 80 or above and share the result.", difficulty: "Medium", xp: 100, co2SavedKg: 0, requiresEvidence: true, evidenceType: "screenshot", category: "Education", estimatedMinutes: 15 },
  { id: "lib-004", title: "Lower the Thermostat", description: "Lower your thermostat 2°F in winter (or raise 2°F in summer) for at least one full day.", difficulty: "Easy", xp: 50, co2SavedKg: 2.4, requiresEvidence: false, evidenceType: "none", category: "Home Energy", estimatedMinutes: 1 },
  { id: "lib-005", title: "Install an LED Bulb", description: "Replace at least one incandescent or CFL bulb with an LED equivalent.", difficulty: "Easy", xp: 50, co2SavedKg: 15, requiresEvidence: true, evidenceType: "photo", category: "Home Energy", estimatedMinutes: 10 },
  { id: "lib-006", title: "Teach Someone About Renewables", description: "Have a real conversation with a friend or family member about how solar or wind power works.", difficulty: "Hard", xp: 250, co2SavedKg: 0, requiresEvidence: true, evidenceType: "reflection", category: "Community", estimatedMinutes: 30 },
  { id: "lib-007", title: "Share Your Simulator Result", description: "Share a link to your grid design from the Energy Simulator on social media or with a friend.", difficulty: "Easy", xp: 50, co2SavedKg: 0, requiresEvidence: false, evidenceType: "none", category: "Education", estimatedMinutes: 5 },
  { id: "lib-008", title: "Take a Shorter Shower", description: "Cut your shower to 5 minutes or fewer for one full day.", difficulty: "Easy", xp: 50, co2SavedKg: 0.8, requiresEvidence: false, evidenceType: "none", category: "Home Energy", estimatedMinutes: 0 },
  { id: "lib-009", title: "Air-Dry Laundry", description: "Skip the dryer and hang or rack-dry at least one full load of laundry.", difficulty: "Easy", xp: 50, co2SavedKg: 2.7, requiresEvidence: true, evidenceType: "photo", category: "Home Energy", estimatedMinutes: 15 },
  { id: "lib-010", title: "Unplug Idle Electronics", description: "Audit your home and unplug all electronics that aren't in use (chargers, TVs, gaming consoles).", difficulty: "Easy", xp: 50, co2SavedKg: 1.5, requiresEvidence: false, evidenceType: "none", category: "Home Energy", estimatedMinutes: 20 },
  { id: "lib-011", title: "Calculate Your Carbon Footprint", description: "Use an online carbon calculator to estimate your household's annual CO₂ emissions.", difficulty: "Medium", xp: 100, co2SavedKg: 0, requiresEvidence: true, evidenceType: "screenshot", category: "Education", estimatedMinutes: 20 },
  { id: "lib-012", title: "Attend a City Council Energy Meeting", description: "Attend (in person or virtually) a local government meeting that discusses energy, climate, or sustainability.", difficulty: "Hard", xp: 250, co2SavedKg: 0, requiresEvidence: true, evidenceType: "reflection", category: "Advocacy", estimatedMinutes: 60 },
  { id: "lib-013", title: "Sign Up for Green Energy Tariff", description: "Switch your electricity account to a 100% renewable energy tariff through your utility provider.", difficulty: "Hard", xp: 250, co2SavedKg: 500, requiresEvidence: true, evidenceType: "screenshot", category: "Home Energy", estimatedMinutes: 20 },
  { id: "lib-014", title: "Organize a Neighborhood Energy Audit", description: "Coordinate an energy walk-through with at least two neighbors to identify energy waste opportunities.", difficulty: "Expert", xp: 500, co2SavedKg: 0, requiresEvidence: true, evidenceType: "photo", category: "Community", estimatedMinutes: 90 },
  { id: "lib-015", title: "Plant a Tree", description: "Plant at least one tree in your yard, community garden, or through a verified tree-planting program.", difficulty: "Medium", xp: 100, co2SavedKg: 21, requiresEvidence: true, evidenceType: "photo", category: "Community", estimatedMinutes: 45 },
  { id: "lib-016", title: "Carpool for One Week", description: "Share rides with at least one other person for every trip you would normally take alone.", difficulty: "Hard", xp: 250, co2SavedKg: 12, requiresEvidence: false, evidenceType: "none", category: "Transportation", estimatedMinutes: 0 },
  { id: "lib-017", title: "Write to Your Representative", description: "Email or call your state or federal representative about a clean energy or climate policy.", difficulty: "Medium", xp: 100, co2SavedKg: 0, requiresEvidence: true, evidenceType: "screenshot", category: "Advocacy", estimatedMinutes: 20 },
  { id: "lib-018", title: "Go Plant-Based for a Day", description: "Eat no meat or dairy for one full day. Plant-based diets can cut food-related emissions by up to 73%.", difficulty: "Easy", xp: 50, co2SavedKg: 3.5, requiresEvidence: false, evidenceType: "none", category: "Lifestyle", estimatedMinutes: 0 },
  { id: "lib-019", title: "Research Community Solar", description: "Look up a community solar project available in your area and learn how to subscribe.", difficulty: "Easy", xp: 50, co2SavedKg: 0, requiresEvidence: false, evidenceType: "none", category: "Education", estimatedMinutes: 15 },
  { id: "lib-020", title: "Complete an Energy Quiz", description: "Take an online quiz about renewable energy, grid operations, or climate science and score 80%+.", difficulty: "Easy", xp: 50, co2SavedKg: 0, requiresEvidence: true, evidenceType: "screenshot", category: "Education", estimatedMinutes: 10 },
];

const store: { events: ChallengeEvent[] } = {
  events: [
    // Seeded demo event
    (() => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      const end = new Date(now);
      end.setDate(end.getDate() + 6);

      const missions: EventMission[] = [
        { ...MISSION_LIBRARY[0]!, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null },
        { ...MISSION_LIBRARY[1]!, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null },
        { ...MISSION_LIBRARY[2]!, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null },
        { ...MISSION_LIBRARY[4]!, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null },
        { ...MISSION_LIBRARY[5]!, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null },
      ];

      const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

      const participants: EventParticipant[] = [
        { id: "p-001", name: "Alex Chen", teamName: "Solar Sparks", xp: 450, joinedAt: ago(240), completedMissionIds: ["lib-001", "lib-002"] },
        { id: "p-002", name: "Sophia Martinez", teamName: "Wind Warriors", xp: 350, joinedAt: ago(220), completedMissionIds: ["lib-001"] },
        { id: "p-003", name: "Marcus Kim", teamName: "Solar Sparks", xp: 300, joinedAt: ago(180), completedMissionIds: ["lib-003"] },
        { id: "p-004", name: "Priya Patel", teamName: "Green Grid", xp: 250, joinedAt: ago(150), completedMissionIds: ["lib-001"] },
        { id: "p-005", name: "Jordan Lee", teamName: "Wind Warriors", xp: 150, joinedAt: ago(120), completedMissionIds: ["lib-002"] },
      ];

      const submissions: Submission[] = [
        { id: "sub-001", participantId: "p-003", participantName: "Marcus Kim", missionId: "lib-003", missionTitle: "Complete a Grid Simulator Scenario", status: "approved", evidence: "Scored 91/100 with 78% renewable grid!", submittedAt: ago(90), reviewedAt: ago(60), feedback: "Great work Marcus!" },
        { id: "sub-002", participantId: "p-002", participantName: "Sophia Martinez", missionId: "lib-001", missionTitle: "Turn Off the Lights", status: "approved", evidence: null, submittedAt: ago(150), reviewedAt: ago(130), feedback: null },
        { id: "sub-003", participantId: "p-004", participantName: "Priya Patel", missionId: "lib-006", missionTitle: "Teach Someone About Renewables", status: "pending", evidence: "I explained solar panels to my parents. They were surprised how much cheaper solar has gotten.", submittedAt: ago(30), reviewedAt: null, feedback: null },
      ];

      return {
        id: "evt-demo",
        name: "Earth Week 2027",
        host: "Naperville Central High School",
        description: "A week-long energy challenge for students and staff to cut emissions and learn about clean power.",
        goal: "Reduce the most CO₂ as a community.",
        joinCode: "EARTH7",
        organizerCode: "ORG-EARTH7",
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        isPrivate: false,
        status: "active",
        missions,
        participants,
        submissions,
        createdAt: ago(300),
      } satisfies ChallengeEvent;
    })(),
  ],
};

function findEvent(code: string) {
  return store.events.find((e) => e.joinCode.toUpperCase() === code.toUpperCase());
}

function teamLeaderboard(event: ChallengeEvent) {
  const teams: Record<string, { name: string; xp: number; members: number; co2Kg: number; completions: number }> = {};
  for (const p of event.participants) {
    const t = p.teamName ?? "(No Team)";
    if (!teams[t]) teams[t] = { name: t, xp: 0, members: 0, co2Kg: 0, completions: 0 };
    teams[t]!.xp += p.xp;
    teams[t]!.members += 1;
    teams[t]!.completions += p.completedMissionIds.length;
    for (const mid of p.completedMissionIds) {
      const mission = event.missions.find((m) => m.id === mid);
      if (mission) teams[t]!.co2Kg += mission.co2SavedKg;
    }
  }
  return Object.values(teams)
    .sort((a, b) => b.xp - a.xp)
    .map((t, i) => ({ rank: i + 1, ...t }));
}

function participantLeaderboard(event: ChallengeEvent) {
  return [...event.participants]
    .sort((a, b) => b.xp - a.xp)
    .map((p, i) => ({
      rank: i + 1,
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      xp: p.xp,
      completions: p.completedMissionIds.length,
    }));
}

// ── GET /events/mission-library ─────────────────────────────────────────────
router.get("/events/mission-library", (_req, res) => {
  res.json(MISSION_LIBRARY);
});

// ── POST /events ─────────────────────────────────────────────────────────────
router.post("/events", (req, res) => {
  const { name, host, description, goal, startDate, endDate, isPrivate, missionIds, customMissions } =
    req.body as {
      name: string;
      host: string;
      description?: string;
      goal?: string;
      startDate: string;
      endDate: string;
      isPrivate?: boolean;
      missionIds?: string[];
      customMissions?: Array<{ title: string; description: string; difficulty: MissionDifficulty; xp: number; co2SavedKg?: number; requiresEvidence?: boolean; evidenceType?: EvidenceType }>;
    };

  if (!name || !host || !startDate || !endDate) {
    res.status(400).json({ error: "name, host, startDate, endDate are required" });
    return;
  }

  const selectedMissions: EventMission[] = [];

  for (const id of missionIds ?? []) {
    const tmpl = MISSION_LIBRARY.find((m) => m.id === id);
    if (tmpl) selectedMissions.push({ ...tmpl, bonusMultiplier: 1, isFlash: false, flashExpiresAt: null, deadline: null });
  }

  for (const cm of customMissions ?? []) {
    selectedMissions.push({
      id: `custom-${makeId()}`,
      title: cm.title,
      description: cm.description,
      difficulty: cm.difficulty,
      xp: cm.xp,
      co2SavedKg: cm.co2SavedKg ?? 0,
      requiresEvidence: cm.requiresEvidence ?? false,
      evidenceType: cm.evidenceType ?? "none",
      category: "Custom",
      estimatedMinutes: 0,
      bonusMultiplier: 1,
      isFlash: false,
      flashExpiresAt: null,
      deadline: null,
    });
  }

  const joinCode = makeCode(6);
  const organizerCode = `ORG-${makeCode(8)}`;

  const event: ChallengeEvent = {
    id: `evt-${makeId()}`,
    name,
    host,
    description: description ?? "",
    goal: goal ?? "Earn the most XP and save the most CO₂.",
    joinCode,
    organizerCode,
    startDate,
    endDate,
    isPrivate: isPrivate ?? false,
    status: "active",
    missions: selectedMissions,
    participants: [],
    submissions: [],
    createdAt: new Date().toISOString(),
  };

  store.events.push(event);
  res.status(201).json({ id: event.id, joinCode, organizerCode, name: event.name });
});

// ── GET /events/:code ─────────────────────────────────────────────────────────
router.get("/events/:code", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const activeMissions = event.missions.filter((m) => {
    if (m.isFlash && m.flashExpiresAt && new Date(m.flashExpiresAt) < new Date()) return false;
    return true;
  });

  res.json({
    id: event.id,
    name: event.name,
    host: event.host,
    description: event.description,
    goal: event.goal,
    joinCode: event.joinCode,
    startDate: event.startDate,
    endDate: event.endDate,
    isPrivate: event.isPrivate,
    status: event.status,
    participantCount: event.participants.length,
    missions: activeMissions,
  });
});

// ── GET /events/:code/organizer ───────────────────────────────────────────────
router.get("/events/:code/organizer", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  const { organizerCode } = req.query as { organizerCode?: string };
  if (!organizerCode || organizerCode !== event.organizerCode) {
    res.status(403).json({ error: "Invalid organizer code" }); return;
  }

  const pendingSubmissions = event.submissions.filter((s) => s.status === "pending");
  const approvedCount = event.submissions.filter((s) => s.status === "approved").length;
  const totalXp = event.participants.reduce((s, p) => s + p.xp, 0);
  const totalCo2 = event.participants.reduce((sum, p) => {
    return sum + p.completedMissionIds.reduce((ms, mid) => {
      const m = event.missions.find((m) => m.id === mid);
      return ms + (m?.co2SavedKg ?? 0);
    }, 0);
  }, 0);
  const completionRate = event.participants.length > 0
    ? event.participants.filter((p) => p.completedMissionIds.length > 0).length / event.participants.length
    : 0;

  res.json({
    event: {
      id: event.id,
      name: event.name,
      host: event.host,
      description: event.description,
      goal: event.goal,
      joinCode: event.joinCode,
      organizerCode: event.organizerCode,
      startDate: event.startDate,
      endDate: event.endDate,
      isPrivate: event.isPrivate,
      status: event.status,
      missions: event.missions,
    },
    participants: participantLeaderboard(event),
    teamLeaderboard: teamLeaderboard(event),
    pendingSubmissions,
    stats: {
      totalParticipants: event.participants.length,
      totalXp,
      totalCo2Kg: parseFloat(totalCo2.toFixed(1)),
      approvedSubmissions: approvedCount,
      pendingSubmissions: pendingSubmissions.length,
      completionRate: parseFloat((completionRate * 100).toFixed(1)),
    },
  });
});

// ── POST /events/:code/join ────────────────────────────────────────────────────
router.post("/events/:code/join", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  if (event.status === "closed") { res.status(400).json({ error: "This event is closed" }); return; }

  const { name, teamName } = req.body as { name: string; teamName?: string };
  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

  const participant: EventParticipant = {
    id: `p-${makeId()}`,
    name: name.trim(),
    teamName: teamName?.trim() || null,
    xp: 0,
    joinedAt: new Date().toISOString(),
    completedMissionIds: [],
  };
  event.participants.push(participant);

  const lb = participantLeaderboard(event);
  const rank = lb.find((p) => p.id === participant.id)?.rank ?? event.participants.length;

  res.status(201).json({ participantId: participant.id, name: participant.name, teamName: participant.teamName, xp: 0, rank, missions: event.missions });
});

// ── GET /events/:code/leaderboard ─────────────────────────────────────────────
router.get("/events/:code/leaderboard", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  res.json({
    participants: participantLeaderboard(event),
    teams: teamLeaderboard(event),
  });
});

// ── POST /events/:code/submit ─────────────────────────────────────────────────
router.post("/events/:code/submit", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const { participantId, missionId, evidence } = req.body as { participantId: string; missionId: string; evidence?: string };
  const participant = event.participants.find((p) => p.id === participantId);
  if (!participant) { res.status(404).json({ error: "Participant not found" }); return; }

  const mission = event.missions.find((m) => m.id === missionId);
  if (!mission) { res.status(404).json({ error: "Mission not found" }); return; }

  if (participant.completedMissionIds.includes(missionId)) {
    res.status(400).json({ error: "Mission already completed" }); return;
  }

  const submission: Submission = {
    id: `sub-${makeId()}`,
    participantId,
    participantName: participant.name,
    missionId,
    missionTitle: mission.title,
    status: mission.requiresEvidence ? "pending" : "approved",
    evidence: evidence ?? null,
    submittedAt: new Date().toISOString(),
    reviewedAt: mission.requiresEvidence ? null : new Date().toISOString(),
    feedback: null,
  };
  event.submissions.push(submission);

  let xpAwarded = 0;
  if (!mission.requiresEvidence) {
    const xp = Math.round(mission.xp * mission.bonusMultiplier);
    participant.xp += xp;
    participant.completedMissionIds.push(missionId);
    xpAwarded = xp;
  }

  const lb = participantLeaderboard(event);
  const rank = lb.find((p) => p.id === participantId)?.rank ?? event.participants.length;

  res.status(201).json({
    submissionId: submission.id,
    status: submission.status,
    xpAwarded,
    totalXp: participant.xp,
    rank,
    message: mission.requiresEvidence
      ? "Submitted for organizer review. XP will be awarded after approval."
      : `+${xpAwarded} XP awarded!`,
  });
});

// ── POST /events/:code/submissions/:submissionId/review ───────────────────────
router.post("/events/:code/submissions/:submissionId/review", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const { organizerCode, action, feedback } = req.body as { organizerCode: string; action: "approve" | "reject"; feedback?: string };
  if (organizerCode !== event.organizerCode) { res.status(403).json({ error: "Invalid organizer code" }); return; }

  const sub = event.submissions.find((s) => s.id === req.params.submissionId);
  if (!sub) { res.status(404).json({ error: "Submission not found" }); return; }
  if (sub.status !== "pending") { res.status(400).json({ error: "Submission already reviewed" }); return; }

  sub.status = action === "approve" ? "approved" : "rejected";
  sub.reviewedAt = new Date().toISOString();
  sub.feedback = feedback ?? null;

  let xpAwarded = 0;
  if (action === "approve") {
    const participant = event.participants.find((p) => p.id === sub.participantId);
    const mission = event.missions.find((m) => m.id === sub.missionId);
    if (participant && mission && !participant.completedMissionIds.includes(sub.missionId)) {
      const xp = Math.round(mission.xp * mission.bonusMultiplier);
      participant.xp += xp;
      participant.completedMissionIds.push(sub.missionId);
      xpAwarded = xp;
    }
  }

  res.json({ submissionId: sub.id, status: sub.status, xpAwarded });
});

// ── POST /events/:code/flash ──────────────────────────────────────────────────
router.post("/events/:code/flash", (req, res) => {
  const event = findEvent(req.params.code!);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const { organizerCode, missionId, durationMinutes = 120, bonusMultiplier = 2 } = req.body as {
    organizerCode: string; missionId: string; durationMinutes?: number; bonusMultiplier?: number;
  };
  if (organizerCode !== event.organizerCode) { res.status(403).json({ error: "Invalid organizer code" }); return; }

  const tmpl = MISSION_LIBRARY.find((m) => m.id === missionId);
  if (!tmpl) { res.status(404).json({ error: "Mission template not found" }); return; }

  const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();
  const flash: EventMission = {
    ...tmpl,
    id: `flash-${makeId()}`,
    bonusMultiplier,
    isFlash: true,
    flashExpiresAt: expiresAt,
    deadline: expiresAt,
  };
  event.missions.push(flash);

  res.status(201).json({ missionId: flash.id, title: flash.title, bonusMultiplier, expiresAt });
});

export default router;
