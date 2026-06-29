import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Users, Trophy, Zap, Leaf, CheckCircle2, Clock, Star, ChevronRight,
  Plus, Copy, Eye, ThumbsUp, ThumbsDown, Flame, BarChart3, Lock,
  BookOpen, Target, Shield, AlertCircle, X
} from "lucide-react";

// ─── Types (mirroring backend) ────────────────────────────────────────────────

interface MissionLibraryItem {
  id: string; title: string; description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  xp: number; co2SavedKg: number; requiresEvidence: boolean;
  evidenceType: "none" | "photo" | "screenshot" | "reflection" | "quiz";
  category: string; estimatedMinutes: number;
}

interface EventMission extends MissionLibraryItem {
  bonusMultiplier: number; isFlash: boolean;
  flashExpiresAt: string | null; deadline: string | null;
}

interface EventParticipantEntry {
  rank: number; id: string; name: string;
  teamName: string | null; xp: number; completions: number;
}

interface EventTeamEntry {
  rank: number; name: string; xp: number;
  members: number; co2Kg: number; completions: number;
}

interface EventSubmission {
  id: string; participantId: string; participantName: string;
  missionId: string; missionTitle: string;
  status: "pending" | "approved" | "rejected";
  evidence: string | null; submittedAt: string;
  reviewedAt: string | null; feedback: string | null;
}

interface OrganizerDashboard {
  event: { id: string; name: string; host: string; description: string; goal: string; joinCode: string; organizerCode: string; startDate: string; endDate: string; isPrivate: boolean; status: string; missions: EventMission[] };
  participants: EventParticipantEntry[];
  teamLeaderboard: EventTeamEntry[];
  pendingSubmissions: EventSubmission[];
  stats: { totalParticipants: number; totalXp: number; totalCo2Kg: number; approvedSubmissions: number; pendingSubmissions: number; completionRate: number };
}

interface ParticipantSession {
  participantId: string; name: string; teamName: string | null;
  xp: number; rank: number; missions: EventMission[];
  eventCode: string; eventName: string; eventHost: string;
  completedMissionIds: string[];
  pendingMissionIds: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = "/api";

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

const DIFFICULTY_COLORS = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-blue-600 bg-blue-50 border-blue-200",
  Hard: "text-amber-600 bg-amber-50 border-amber-200",
  Expert: "text-red-600 bg-red-50 border-red-200",
};

const EVIDENCE_ICONS: Record<string, string> = {
  photo: "📷", screenshot: "🖥️", reflection: "✍️", quiz: "📋", none: "✅",
};

function DifficultyStars({ d }: { d: string }) {
  const count = d === "Easy" ? 1 : d === "Medium" ? 2 : d === "Hard" ? 3 : 4;
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 4 }, (_, i) => (
        <Star key={i} className={cn("w-3 h-3", i < count ? "fill-amber-400 text-amber-400" : "text-muted")} />
      ))}
    </span>
  );
}

function MissionCard({
  mission, completed, pending, onComplete,
}: {
  mission: EventMission;
  completed: boolean;
  pending: boolean;
  onComplete: (missionId: string, evidence?: string) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");

  const effectiveXp = Math.round(mission.xp * mission.bonusMultiplier);
  const isExpired = mission.flashExpiresAt ? new Date(mission.flashExpiresAt) < new Date() : false;

  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 space-y-3 transition-all",
      completed && "opacity-60",
      mission.isFlash && !completed && "border-amber-400 bg-amber-50/50",
      isExpired && "opacity-40"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {mission.isFlash && <Badge className="text-xs bg-amber-500 text-white border-0">⚡ Flash</Badge>}
            <Badge variant="outline" className={cn("text-xs", DIFFICULTY_COLORS[mission.difficulty])}>
              {mission.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">{mission.category}</Badge>
          </div>
          <h4 className="font-semibold text-sm leading-snug">{mission.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mission.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-base text-emerald-600">+{effectiveXp} XP</div>
          {mission.bonusMultiplier > 1 && (
            <div className="text-xs text-amber-600 font-semibold">{mission.bonusMultiplier}× BONUS</div>
          )}
          {mission.co2SavedKg > 0 && (
            <div className="text-xs text-muted-foreground">{mission.co2SavedKg}kg CO₂</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <DifficultyStars d={mission.difficulty} />
        {mission.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mission.estimatedMinutes}m</span>
        )}
        {mission.requiresEvidence && (
          <span className="flex items-center gap-1">
            {EVIDENCE_ICONS[mission.evidenceType]} Requires {mission.evidenceType}
          </span>
        )}
        {mission.flashExpiresAt && !isExpired && (
          <span className="text-amber-600 font-medium">
            Expires {new Date(mission.flashExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {completed ? (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Completed
        </div>
      ) : pending ? (
        <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
          <Clock className="w-4 h-4" /> Pending organizer approval
        </div>
      ) : isExpired ? (
        <div className="text-muted-foreground text-sm">This flash challenge has expired</div>
      ) : showEvidence ? (
        <div className="space-y-2">
          <Label className="text-xs">
            {mission.evidenceType === "photo" ? "Describe your photo:" :
             mission.evidenceType === "screenshot" ? "Paste screenshot text or describe:" :
             mission.evidenceType === "reflection" ? "Write your reflection:" :
             "Answer or describe:"}
          </Label>
          <Textarea
            placeholder={`Describe your evidence for "${mission.title}"...`}
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            className="text-sm min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onComplete(mission.id, evidenceText); setShowEvidence(false); }} disabled={!evidenceText.trim()}>
              Submit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowEvidence(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => {
          if (mission.requiresEvidence) setShowEvidence(true);
          else onComplete(mission.id);
        }}>
          {mission.requiresEvidence ? `Submit with ${mission.evidenceType}` : "Mark Complete"}
        </Button>
      )}
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

type View = "landing" | "create" | "created" | "join" | "organizer" | "participant" | "organizer-access";

export default function Events() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("landing");

  // Organizer state
  const [library, setLibrary] = useState<MissionLibraryItem[]>([]);
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set());
  const [customMissions, setCustomMissions] = useState<Array<{ title: string; description: string; difficulty: "Easy" | "Medium" | "Hard" | "Expert"; xp: number }>>([]);
  const [createForm, setCreateForm] = useState({ name: "", host: "", description: "", goal: "", startDate: "", endDate: "", isPrivate: false });
  const [createdEvent, setCreatedEvent] = useState<{ joinCode: string; organizerCode: string; name: string } | null>(null);
  const [orgDashboard, setOrgDashboard] = useState<OrganizerDashboard | null>(null);
  const [orgCode, setOrgCode] = useState("");
  const [orgCodeInput, setOrgCodeInput] = useState("");
  const [orgEventCode, setOrgEventCode] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);

  // Participant state
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinTeam, setJoinTeam] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ participants: EventParticipantEntry[]; teams: EventTeamEntry[] } | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [flashCode, setFlashCode] = useState("");
  const [flashMissionId, setFlashMissionId] = useState("");
  const [flashDuration, setFlashDuration] = useState("60");
  const [flashLoading, setFlashLoading] = useState(false);

  // Load library on mount
  useEffect(() => {
    api<MissionLibraryItem[]>("/events/mission-library").then(setLibrary).catch(() => {});
  }, []);

  // Poll leaderboard when in participant view
  useEffect(() => {
    if (!participant) return;
    const refresh = () => api<{ participants: EventParticipantEntry[]; teams: EventTeamEntry[] }>(`/events/${participant.eventCode}/leaderboard`).then(setLeaderboard).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [participant]);

  // Poll organizer dashboard
  useEffect(() => {
    if (!orgCode || !orgEventCode) return;
    const refresh = () => api<OrganizerDashboard>(`/events/${orgEventCode}/organizer?organizerCode=${orgCode}`).then(setOrgDashboard).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 10_000);
    return () => clearInterval(timer);
  }, [orgCode, orgEventCode]);

  const handleCreate = useCallback(async () => {
    if (!createForm.name || !createForm.host || !createForm.startDate || !createForm.endDate) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    if (selectedMissionIds.size === 0 && customMissions.length === 0) {
      toast({ title: "Add at least one mission", variant: "destructive" }); return;
    }
    try {
      const result = await api<{ joinCode: string; organizerCode: string; name: string }>("/events", {
        method: "POST",
        body: JSON.stringify({
          ...createForm,
          missionIds: Array.from(selectedMissionIds),
          customMissions,
        }),
      });
      setCreatedEvent(result);
      setOrgCode(result.organizerCode);
      setOrgEventCode(result.joinCode);
      setView("created");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    }
  }, [createForm, selectedMissionIds, customMissions, toast]);

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim() || !joinName.trim()) {
      toast({ title: "Enter a join code and your name", variant: "destructive" }); return;
    }
    setJoinLoading(true);
    try {
      const eventData = await api<{ name: string; host: string; joinCode: string }>(`/events/${joinCode.trim().toUpperCase()}`);
      const result = await api<{ participantId: string; name: string; teamName: string | null; xp: number; rank: number; missions: EventMission[] }>(
        `/events/${joinCode.trim().toUpperCase()}/join`,
        { method: "POST", body: JSON.stringify({ name: joinName.trim(), teamName: joinTeam.trim() || undefined }) }
      );
      setParticipant({
        participantId: result.participantId,
        name: result.name,
        teamName: result.teamName,
        xp: result.xp,
        rank: result.rank,
        missions: result.missions,
        eventCode: joinCode.trim().toUpperCase(),
        eventName: eventData.name,
        eventHost: eventData.host,
        completedMissionIds: [],
        pendingMissionIds: [],
      });
      setView("participant");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setJoinLoading(false);
    }
  }, [joinCode, joinName, joinTeam, toast]);

  const handleComplete = useCallback(async (missionId: string, evidence?: string) => {
    if (!participant) return;
    setSubmitting(missionId);
    try {
      const result = await api<{ submissionId: string; status: string; xpAwarded: number; totalXp: number; rank: number; message: string }>(
        `/events/${participant.eventCode}/submit`,
        { method: "POST", body: JSON.stringify({ participantId: participant.participantId, missionId, evidence }) }
      );
      const isPending = result.status === "pending";
      setParticipant((prev) => prev ? {
        ...prev,
        xp: result.totalXp,
        rank: result.rank,
        completedMissionIds: isPending ? prev.completedMissionIds : [...prev.completedMissionIds, missionId],
        pendingMissionIds: isPending ? [...prev.pendingMissionIds, missionId] : prev.pendingMissionIds,
      } : prev);
      toast({ title: result.message, description: isPending ? "The organizer will review your submission." : undefined });
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  }, [participant, toast]);

  const handleReview = useCallback(async (submissionId: string, action: "approve" | "reject", feedback?: string) => {
    if (!orgDashboard) return;
    try {
      await api(`/events/${orgDashboard.event.joinCode}/submissions/${submissionId}/review`, {
        method: "POST",
        body: JSON.stringify({ organizerCode: orgCode, action, feedback }),
      });
      toast({ title: action === "approve" ? "✅ Approved — XP awarded!" : "❌ Submission rejected" });
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    }
  }, [orgDashboard, orgCode, toast]);

  const handleFlash = useCallback(async () => {
    if (!orgDashboard || !flashMissionId) return;
    setFlashLoading(true);
    try {
      const result = await api<{ missionId: string; title: string; bonusMultiplier: number; expiresAt: string }>(
        `/events/${orgDashboard.event.joinCode}/flash`,
        { method: "POST", body: JSON.stringify({ organizerCode: orgCode, missionId: flashMissionId, durationMinutes: parseInt(flashDuration), bonusMultiplier: 2 }) }
      );
      toast({ title: `⚡ Flash challenge launched: ${result.title}`, description: `2× XP for ${flashDuration} minutes!` });
      setFlashMissionId("");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setFlashLoading(false);
    }
  }, [orgDashboard, flashMissionId, flashDuration, orgCode, toast]);

  const handleOrganizerAccess = useCallback(async () => {
    if (!orgCodeInput.trim() || !flashCode.trim()) {
      toast({ title: "Enter the event join code and your organizer code", variant: "destructive" }); return;
    }
    setOrgLoading(true);
    try {
      const dash = await api<OrganizerDashboard>(`/events/${flashCode.trim().toUpperCase()}/organizer?organizerCode=${orgCodeInput.trim()}`);
      setOrgDashboard(dash);
      setOrgCode(orgCodeInput.trim());
      setOrgEventCode(flashCode.trim().toUpperCase());
      setView("organizer");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setOrgLoading(false);
    }
  }, [orgCodeInput, flashCode, toast]);

  // ── Landing ────────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-violet-600 border-violet-300 px-3 py-1 font-semibold">
            ⚡ Challenge Platform
          </Badge>
          <h1 className="text-4xl font-black leading-tight">Run Your Own Energy Challenge</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Teachers, cities, nonprofits, and clubs create custom energy challenges.
            Participants join with a code, complete missions, and compete on a live leaderboard.
          </p>
          <p className="text-sm text-muted-foreground italic">Think Kahoot × Duolingo × fantasy sports — but for clean energy.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setView("create")}
            className="rounded-2xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 p-6 text-left transition-colors group"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-xl font-bold mb-1">Create a Challenge</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Set missions, duration, and get a join code. Watch your participants compete in real time.
            </p>
            <div className="flex items-center gap-1 text-violet-600 font-semibold text-sm group-hover:gap-2 transition-all">
              I'm an organizer <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setView("join")}
            className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 p-6 text-left transition-colors group"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h2 className="text-xl font-bold mb-1">Join a Challenge</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Got a code? Join your team's challenge, complete missions, and climb the leaderboard.
            </p>
            <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm group-hover:gap-2 transition-all">
              I'm a participant <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="rounded-2xl border bg-muted/40 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Demo: Earth Week 2027</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Try the demo event hosted by Naperville Central High School. Join code: <code className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">EARTH7</code>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { setJoinCode("EARTH7"); setView("join"); }}>
              Join demo as participant
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setFlashCode("EARTH7"); setOrgCodeInput("ORG-EARTH7"); setView("organizer-access"); }}>
              View demo organizer dashboard
            </Button>
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => setView("organizer-access")} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
            Already have an organizer code? Access your dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ── Organizer access ────────────────────────────────────────────────────────
  if (view === "organizer-access") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => setView("landing")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Back</button>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Access Organizer Dashboard</h1>
          <p className="text-muted-foreground text-sm">Enter your event's join code and your private organizer code.</p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <Label>Event Join Code</Label>
            <Input value={flashCode} onChange={e => setFlashCode(e.target.value.toUpperCase())} placeholder="EARTH7" className="mt-1 font-mono" />
          </div>
          <div>
            <Label>Organizer Code (private)</Label>
            <Input value={orgCodeInput} onChange={e => setOrgCodeInput(e.target.value)} placeholder="ORG-XXXXXXXX" className="mt-1 font-mono" />
          </div>
          <Button className="w-full" onClick={handleOrganizerAccess} disabled={orgLoading}>
            {orgLoading ? "Loading..." : "Access Dashboard"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  if (view === "create") {
    const CATEGORIES = Array.from(new Set(library.map((m) => m.category)));
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("landing")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <h1 className="text-2xl font-bold">Create a Challenge</h1>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details">① Event Details</TabsTrigger>
            <TabsTrigger value="missions">② Pick Missions ({selectedMissionIds.size + customMissions.length})</TabsTrigger>
            <TabsTrigger value="review">③ Review & Launch</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Challenge Name *</Label>
                  <Input className="mt-1" placeholder="Earth Week 2027" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Hosted By *</Label>
                  <Input className="mt-1" placeholder="Naperville Central High School" value={createForm.host} onChange={e => setCreateForm(f => ({ ...f, host: e.target.value }))} />
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" className="mt-1" value={createForm.startDate} onChange={e => setCreateForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input type="date" className="mt-1" value={createForm.endDate} onChange={e => setCreateForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" placeholder="Tell participants what this challenge is about..." value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Challenge Goal</Label>
                <Input className="mt-1" placeholder="Reduce the most CO₂ as a community." value={createForm.goal} onChange={e => setCreateForm(f => ({ ...f, goal: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="private" checked={createForm.isPrivate} onCheckedChange={v => setCreateForm(f => ({ ...f, isPrivate: v === true }))} />
                <Label htmlFor="private" className="flex items-center gap-1 cursor-pointer">
                  <Lock className="w-3.5 h-3.5" /> Private (requires join code)
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="missions" className="space-y-4 mt-4">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{cat}</h3>
                <div className="space-y-2">
                  {library.filter(m => m.category === cat).map((m) => (
                    <label key={m.id} className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                      selectedMissionIds.has(m.id) ? "border-violet-400 bg-violet-50" : "bg-card hover:bg-muted/50"
                    )}>
                      <Checkbox
                        checked={selectedMissionIds.has(m.id)}
                        onCheckedChange={(v) => {
                          setSelectedMissionIds(prev => {
                            const n = new Set(prev);
                            if (v) n.add(m.id); else n.delete(m.id);
                            return n;
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-medium text-sm">{m.title}</span>
                          <Badge variant="outline" className={cn("text-xs", DIFFICULTY_COLORS[m.difficulty])}>{m.difficulty}</Badge>
                          <span className="text-xs font-bold text-emerald-600">+{m.xp} XP</span>
                          {m.requiresEvidence && <span className="text-xs text-muted-foreground">{EVIDENCE_ICONS[m.evidenceType]} needs {m.evidenceType}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border-2 border-dashed border-muted p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add Custom Mission</h3>
              {customMissions.map((cm, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2 text-sm">
                  <span className="flex-1">{cm.title} — +{cm.xp} XP</span>
                  <button onClick={() => setCustomMissions(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <CustomMissionForm onAdd={(cm) => setCustomMissions(prev => [...prev, cm])} />
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4 mt-4">
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="font-bold text-lg">{createForm.name || "Untitled Challenge"}</h3>
              <p className="text-sm text-muted-foreground">{createForm.host}</p>
              <div className="flex gap-4 text-sm">
                <span>📅 {createForm.startDate} → {createForm.endDate}</span>
                {createForm.isPrivate && <span><Lock className="w-3.5 h-3.5 inline" /> Private</span>}
              </div>
              {createForm.goal && <p className="text-sm italic">Goal: {createForm.goal}</p>}
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">{selectedMissionIds.size + customMissions.length} missions selected</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedMissionIds).map(id => {
                    const m = library.find(l => l.id === id);
                    return m ? <Badge key={id} variant="outline" className="text-xs">{m.title}</Badge> : null;
                  })}
                  {customMissions.map((cm, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-violet-300 text-violet-700">✨ {cm.title}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={handleCreate} size="lg">
              Launch Challenge <Zap className="w-4 h-4 ml-2" />
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── Created ────────────────────────────────────────────────────────────────
  if (view === "created" && createdEvent) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-black">Challenge Created!</h1>
        <p className="text-muted-foreground">{createdEvent.name} is live and ready for participants.</p>

        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 space-y-4 text-left">
          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Participant Join Code</div>
            <div className="flex items-center gap-3">
              <code className="text-3xl font-black tracking-widest text-emerald-700">{createdEvent.joinCode}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(createdEvent.joinCode); toast({ title: "Copied!" }); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this with participants. They enter it on the Events page.</p>
          </div>
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Your Organizer Code (private)</div>
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono text-muted-foreground break-all">{createdEvent.organizerCode}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(createdEvent.organizerCode); toast({ title: "Copied!" }); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Save this — it's the only way to access your organizer dashboard.</p>
          </div>
        </div>

        <Button className="w-full" onClick={() => setView("organizer")}>
          Open Organizer Dashboard <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // ── Organizer Dashboard ────────────────────────────────────────────────────
  if (view === "organizer" && orgDashboard) {
    const { event, participants, teamLeaderboard, pendingSubmissions, stats } = orgDashboard;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">{event.name}</h1>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {event.host} · Join code: <code className="font-bold text-foreground">{event.joinCode}</code> · {event.startDate} → {event.endDate}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(event.joinCode); toast({ title: "Join code copied!" }); }}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy join code
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: <Users className="w-4 h-4 text-blue-500" />, label: "Participants", value: stats.totalParticipants },
            { icon: <Zap className="w-4 h-4 text-amber-500" />, label: "Total XP", value: stats.totalXp.toLocaleString() },
            { icon: <Leaf className="w-4 h-4 text-emerald-500" />, label: "CO₂ Saved", value: `${stats.totalCo2Kg}kg` },
            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: "Approved", value: stats.approvedSubmissions },
            { icon: <Clock className="w-4 h-4 text-amber-500" />, label: "Pending", value: stats.pendingSubmissions },
            { icon: <BarChart3 className="w-4 h-4 text-violet-500" />, label: "Completion Rate", value: `${stats.completionRate}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{s.icon}<span className="uppercase tracking-wide font-medium">{s.label}</span></div>
              <div className="text-xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="leaderboard">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
            <TabsTrigger value="approvals">
              ✅ Approvals {stats.pendingSubmissions > 0 && <Badge className="ml-1 h-4 text-xs bg-amber-500">{stats.pendingSubmissions}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="missions">📋 Missions</TabsTrigger>
            <TabsTrigger value="flash">⚡ Flash</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Teams</h3>
                <div className="space-y-2">
                  {teamLeaderboard.map((t) => (
                    <div key={t.name} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{t.rank}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.members} members · {t.completions} missions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">{t.xp.toLocaleString()} XP</div>
                        {t.co2Kg > 0 && <div className="text-xs text-muted-foreground">{t.co2Kg.toFixed(1)}kg CO₂</div>}
                      </div>
                    </div>
                  ))}
                  {teamLeaderboard.length === 0 && <p className="text-sm text-muted-foreground">No teams yet — participants are competing individually.</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Individuals</h3>
                <div className="space-y-2">
                  {participants.slice(0, 10).map((p) => (
                    <div key={p.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{p.rank}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.teamName ?? "No team"} · {p.completions} missions</div>
                      </div>
                      <div className="font-bold text-emerald-600 text-sm">{p.xp} XP</div>
                    </div>
                  ))}
                  {participants.length === 0 && <p className="text-sm text-muted-foreground">No participants yet — share the join code!</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="mt-4 space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p>No pending submissions. You're all caught up!</p>
              </div>
            ) : (
              pendingSubmissions.map((sub) => (
                <SubmissionReviewCard key={sub.id} submission={sub} onReview={handleReview} />
              ))
            )}
          </TabsContent>

          <TabsContent value="missions" className="mt-4">
            <div className="space-y-2">
              {event.missions.map((m) => (
                <div key={m.id} className={cn("rounded-xl border bg-card p-3 flex items-center gap-3", m.isFlash && "border-amber-300 bg-amber-50/50")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.isFlash && <Badge className="text-xs bg-amber-500 text-white border-0">⚡ Flash</Badge>}
                      <span className="font-medium text-sm">{m.title}</span>
                      <Badge variant="outline" className={cn("text-xs", DIFFICULTY_COLORS[m.difficulty])}>{m.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 text-sm">+{Math.round(m.xp * m.bonusMultiplier)} XP</div>
                    {m.bonusMultiplier > 1 && <div className="text-xs text-amber-600">{m.bonusMultiplier}× bonus</div>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="flash" className="mt-4">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold">Launch a Flash Challenge</h3>
              </div>
              <p className="text-sm text-muted-foreground">Pick a mission from the library and give it a time limit with 2× XP. Participants see it immediately.</p>
              <div>
                <Label>Mission</Label>
                <Select value={flashMissionId} onValueChange={setFlashMissionId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a mission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {library.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.title} (+{m.xp} XP)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Select value={flashDuration} onValueChange={setFlashDuration}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["30", "60", "90", "120", "180"].map(d => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleFlash} disabled={!flashMissionId || flashLoading} className="w-full bg-amber-500 hover:bg-amber-600">
                <Zap className="w-4 h-4 mr-2" /> {flashLoading ? "Launching..." : "Launch Flash Challenge (2× XP)"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── Join ────────────────────────────────────────────────────────────────────
  if (view === "join") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => setView("landing")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Back</button>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Join a Challenge</h1>
          <p className="text-sm text-muted-foreground">Enter the join code your organizer shared with you.</p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <Label>Join Code</Label>
            <Input className="mt-1 font-mono text-lg tracking-widest uppercase" placeholder="EARTH7" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={10} />
          </div>
          <div>
            <Label>Your Name *</Label>
            <Input className="mt-1" placeholder="Alex Chen" value={joinName} onChange={e => setJoinName(e.target.value)} />
          </div>
          <div>
            <Label>Team Name (optional)</Label>
            <Input className="mt-1" placeholder="Solar Sparks" value={joinTeam} onChange={e => setJoinTeam(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Join an existing team or create a new one</p>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleJoin} disabled={joinLoading}>
            {joinLoading ? "Joining..." : "Join Challenge"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Participant Dashboard ───────────────────────────────────────────────────
  if (view === "participant" && participant) {
    const myRankEntry = leaderboard?.participants.find(p => p.id === participant.participantId);
    const myTeamRank = leaderboard?.teams.find(t => t.name === participant.teamName);
    const level = participant.xp < 200 ? { n: 1, name: "Energy Rookie" } :
                  participant.xp < 500 ? { n: 2, name: "Power Saver" } :
                  participant.xp < 1000 ? { n: 3, name: "Grid Builder" } :
                  participant.xp < 2000 ? { n: 4, name: "Climate Champion" } :
                  { n: 5, name: "Energy Master" };
    const nextLevelXp = [200, 500, 1000, 2000, Infinity][level.n - 1]!;
    const prevLevelXp = [0, 200, 500, 1000, 2000][level.n - 1]!;
    const levelProgress = Math.min(100, ((participant.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);

    const activeMissions = participant.missions.filter(m => {
      if (m.isFlash && m.flashExpiresAt && new Date(m.flashExpiresAt) < new Date()) return false;
      return !participant.completedMissionIds.includes(m.id);
    });
    const completedMissions = participant.missions.filter(m => participant.completedMissionIds.includes(m.id));

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Welcome back</p>
              <h1 className="text-2xl font-black">{participant.name}</h1>
              <p className="text-sm text-muted-foreground">
                {participant.eventName} · {participant.eventHost}
                {participant.teamName && <> · Team <span className="font-semibold text-foreground">{participant.teamName}</span></>}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-600">{participant.xp}</div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">#{myRankEntry?.rank ?? participant.rank}</div>
                <div className="text-xs text-muted-foreground">Rank</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600">{completedMissions.length}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold">Level {level.n} — {level.name}</span>
              {nextLevelXp < Infinity && <span className="text-muted-foreground">{nextLevelXp - participant.xp} XP to Level {level.n + 1}</span>}
            </div>
            <Progress value={nextLevelXp < Infinity ? levelProgress : 100} className="h-2" />
          </div>
        </div>

        <Tabs defaultValue="missions">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="missions">🎯 Missions ({activeMissions.length})</TabsTrigger>
            <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
            <TabsTrigger value="completed">✅ Completed ({completedMissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="mt-4 space-y-3">
            {activeMissions.filter(m => m.isFlash).length > 0 && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50/60 p-3">
                <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Flash Challenges — earn 2× XP!
                </p>
                <div className="space-y-2">
                  {activeMissions.filter(m => m.isFlash).map(m => (
                    <MissionCard key={m.id} mission={m} completed={participant.completedMissionIds.includes(m.id)} pending={participant.pendingMissionIds.includes(m.id)} onComplete={submitting ? () => {} : handleComplete} />
                  ))}
                </div>
              </div>
            )}

            {activeMissions.filter(m => !m.isFlash).map(m => (
              <MissionCard key={m.id} mission={m} completed={participant.completedMissionIds.includes(m.id)} pending={participant.pendingMissionIds.includes(m.id)} onComplete={submitting ? () => {} : handleComplete} />
            ))}

            {activeMissions.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <Trophy className="w-10 h-10 mx-auto text-amber-400" />
                <p className="font-semibold">All missions complete!</p>
                <p className="text-sm text-muted-foreground">Watch for flash challenges from your organizer.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4 space-y-4">
            {leaderboard && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Teams</h3>
                  {leaderboard.teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teams yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.teams.map((t) => (
                        <div key={t.name} className={cn("rounded-xl border p-3 flex items-center gap-3", t.name === participant.teamName && "border-emerald-400 bg-emerald-50")}>
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{t.rank}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm flex items-center gap-1">
                              {t.name}
                              {t.name === participant.teamName && <Badge className="text-xs bg-emerald-500 text-white border-0 h-4">You</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{t.members} members</div>
                          </div>
                          <div className="font-bold text-emerald-600 text-sm">{t.xp.toLocaleString()} XP</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Individuals</h3>
                  <div className="space-y-2">
                    {leaderboard.participants.map((p) => (
                      <div key={p.id} className={cn("rounded-xl border p-3 flex items-center gap-3", p.id === participant.participantId && "border-blue-400 bg-blue-50")}>
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{p.rank}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm flex items-center gap-1">
                            {p.name}
                            {p.id === participant.participantId && <Badge className="text-xs bg-blue-500 text-white border-0 h-4">You</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.teamName ?? "No team"} · {p.completions} missions</div>
                        </div>
                        <div className="font-bold text-emerald-600 text-sm">{p.xp} XP</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-2">
            {completedMissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2" />
                <p>No missions completed yet. Head to the Missions tab to get started!</p>
              </div>
            ) : (
              completedMissions.map(m => (
                <div key={m.id} className="rounded-xl border bg-card p-3 flex items-center gap-3 opacity-75">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.category}</div>
                  </div>
                  <div className="font-bold text-emerald-600 text-sm">+{Math.round(m.xp * m.bonusMultiplier)} XP</div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}

// ─── Submission Review Card ───────────────────────────────────────────────────

function SubmissionReviewCard({ submission, onReview }: {
  submission: EventSubmission;
  onReview: (id: string, action: "approve" | "reject", feedback?: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);

  if (done) return (
    <div className="rounded-xl border bg-muted/40 p-3 flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="w-4 h-4" /> Reviewed: {submission.participantName} — {submission.missionTitle}
    </div>
  );

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{submission.participantName}</div>
          <div className="text-xs text-muted-foreground">Mission: {submission.missionTitle}</div>
          <div className="text-xs text-muted-foreground">{new Date(submission.submittedAt).toLocaleString()}</div>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>
      </div>
      {submission.evidence && (
        <div className="rounded-lg bg-muted/60 p-3 text-sm italic">
          "{submission.evidence}"
        </div>
      )}
      <div>
        <Input placeholder="Optional feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} className="text-sm mb-2" />
        <div className="flex gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => { onReview(submission.id, "approve", feedback); setDone(true); }}>
            <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { onReview(submission.id, "reject", feedback); setDone(true); }}>
            <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Mission Form ──────────────────────────────────────────────────────

function CustomMissionForm({ onAdd }: { onAdd: (m: { title: string; description: string; difficulty: "Easy" | "Medium" | "Hard" | "Expert"; xp: number }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Expert">("Medium");
  const [xp, setXp] = useState("100");

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Mission Title</Label>
          <Input className="mt-1 text-sm" placeholder="Convince a neighbor to switch to LED" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "Easy" | "Medium" | "Hard" | "Expert")}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Easy", "Medium", "Hard", "Expert"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">XP</Label>
            <Input className="mt-1 text-sm" type="number" min={10} max={1000} value={xp} onChange={e => setXp(e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea className="mt-1 text-sm min-h-[60px]" placeholder="Describe exactly what participants need to do..." value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <Button
        size="sm" variant="outline" className="w-full"
        disabled={!title.trim() || !description.trim()}
        onClick={() => {
          onAdd({ title: title.trim(), description: description.trim(), difficulty, xp: parseInt(xp) || 100 });
          setTitle(""); setDescription(""); setXp("100"); setDifficulty("Medium");
        }}
      >
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Mission
      </Button>
    </div>
  );
}
