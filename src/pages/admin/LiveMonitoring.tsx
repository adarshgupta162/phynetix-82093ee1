import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Monitor,
  Mic,
  MicOff,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Search,
  ChevronLeft,
  Eye,
  BookOpen,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ── TYPES ───────────────────────────────────────────────────── */
interface ProctoringSession {
  id: string;
  attempt_id: string;
  test_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  camera_enabled: boolean;
  mic_enabled: boolean;
  screen_enabled: boolean;
  status: string;
  latest_camera_url: string | null;
  latest_screen_url: string | null;
  snapshot_count: number;
  // joined
  test_name?: string;
  user_name?: string;
  user_email?: string;
}

interface ProctoringEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

/* ── HELPERS ─────────────────────────────────────────────────── */
const eventIcon = (type: string) => {
  switch (type) {
    case "test_start": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case "test_end": return <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />;
    case "tab_switch":
    case "focus_loss": return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    case "fullscreen_exit": return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
    case "question_change":
    case "subject_change": return <BookOpen className="w-3.5 h-3.5 text-purple-500" />;
    case "camera_snapshot": return <Camera className="w-3.5 h-3.5 text-primary" />;
    case "permission_denied": return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    default: return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const eventLabel = (type: string) =>
  type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const elapsed = (startIso: string) => {
  const diff = Date.now() - new Date(startIso).getTime();
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export default function LiveMonitoring() {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("active");
  const [snapshotTs, setSnapshotTs] = useState(Date.now());
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ── Fetch sessions ────────────────────────────────────────── */
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data, error } = await supabase
      .from("proctoring_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      // Enrich with test names and user names
      const testIds = [...new Set(data.map((s) => s.test_id))];
      const userIds = [...new Set(data.map((s) => s.user_id))];

      const [{ data: tests }, { data: profiles }] = await Promise.all([
        supabase.from("tests").select("id, name").in("id", testIds),
        supabase.from("profiles").select("id, full_name").in("id", userIds),
      ]);

      const testMap: Record<string, string> = {};
      tests?.forEach((t) => { testMap[t.id] = t.name; });
      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => { profileMap[p.id] = p.full_name ?? "Unknown"; });

      const enriched = data.map((s) => ({
        ...s,
        test_name: testMap[s.test_id] ?? "Unknown Test",
        user_name: profileMap[s.user_id] ?? "Unknown User",
      })) as ProctoringSession[];

      setSessions(enriched);
      // Update selected session if it changed
      if (selectedSession) {
        const updated = enriched.find((s) => s.id === selectedSession.id);
        if (updated) setSelectedSession(updated);
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, [selectedSession]);

  /* ── Fetch events for selected session ──────────────────────── */
  const fetchEvents = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("proctoring_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setEvents(data as ProctoringEvent[]);
  }, []);

  /* ── Initial load ─────────────────────────────────────────── */
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* ── Realtime updates ─────────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel("proctoring-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proctoring_sessions" },
        () => fetchSessions(true)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "proctoring_events" },
        (payload) => {
          const row = payload.new as ProctoringEvent;
          if (selectedSession && row.session_id === selectedSession.id) {
            setEvents((prev) => [row, ...prev].slice(0, 100));
          }
          // Refresh snapshot when new camera_snapshot event arrives
          if (row.event_type === "camera_snapshot") setSnapshotTs(Date.now());
        }
      )
      .subscribe();

    realtimeRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions, selectedSession]);

  /* ── When session is selected, load events ──────────────────── */
  useEffect(() => {
    if (selectedSession) fetchEvents(selectedSession.id);
    else setEvents([]);
  }, [selectedSession, fetchEvents]);

  /* ── Auto-refresh snapshots every 30s ───────────────────────── */
  useEffect(() => {
    if (!selectedSession) return;
    const t = setInterval(() => {
      setSnapshotTs(Date.now());
      fetchSessions(true);
      fetchEvents(selectedSession.id);
    }, 30_000);
    return () => clearInterval(t);
  }, [selectedSession, fetchSessions, fetchEvents]);

  /* ── Filtered sessions ─────────────────────────────────────── */
  const filtered = sessions.filter((s) => {
    const matchSearch =
      !search ||
      s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.test_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ══════ DETAIL VIEW ══════════════════════════════════════════ */
  if (selectedSession) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{selectedSession.user_name}</h1>
              <p className="text-sm text-muted-foreground">{selectedSession.test_name}</p>
            </div>
            <Badge variant={selectedSession.status === "active" ? "default" : "secondary"}>
              {selectedSession.status === "active" ? (
                <><Activity className="w-3 h-3 mr-1 animate-pulse" />Live</>
              ) : "Ended"}
            </Badge>
          </div>

          {/* Snapshot grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SnapshotPanel
              label="Camera"
              icon={<Camera className="w-4 h-4" />}
              url={selectedSession.latest_camera_url}
              enabled={selectedSession.camera_enabled}
              ts={snapshotTs}
            />
            <SnapshotPanel
              label="Screen"
              icon={<Monitor className="w-4 h-4" />}
              url={selectedSession.latest_screen_url}
              enabled={selectedSession.screen_enabled}
              ts={snapshotTs}
            />
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Duration" value={elapsed(selectedSession.started_at)} />
            <StatCard label="Snapshots" value={String(selectedSession.snapshot_count)} />
            <StatCard
              label="Mic"
              value={selectedSession.mic_enabled ? "Enabled" : "Disabled"}
              icon={selectedSession.mic_enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            />
            <StatCard
              label="Started"
              value={new Date(selectedSession.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />
          </div>

          {/* Event log */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Event Log</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEvents(selectedSession.id)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No events recorded yet</div>
              ) : (
                events.map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ══════ LIST VIEW ════════════════════════════════════════════ */
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Live Monitoring
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time proctoring sessions across all tests
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSessions(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or test..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sessions" value={String(sessions.length)} />
          <StatCard
            label="Active Now"
            value={String(sessions.filter((s) => s.status === "active").length)}
            highlight
          />
          <StatCard
            label="With Camera"
            value={String(sessions.filter((s) => s.camera_enabled && s.status === "active").length)}
          />
          <StatCard
            label="With Screen"
            value={String(sessions.filter((s) => s.screen_enabled && s.status === "active").length)}
          />
        </div>

        {/* Sessions grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No sessions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onClick={() => setSelectedSession(s)}
                snapshotTs={snapshotTs}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── SUB-COMPONENTS ──────────────────────────────────────────── */

function SessionCard({
  session,
  onClick,
  snapshotTs,
}: {
  session: ProctoringSession;
  onClick: () => void;
  snapshotTs: number;
}) {
  const isActive = session.status === "active";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      {/* Snapshot thumbnail */}
      <div className="relative aspect-video bg-muted rounded-t-xl overflow-hidden">
        {session.latest_camera_url ? (
          <img
            key={`${session.id}-${snapshotTs}`}
            src={`${session.latest_camera_url}?t=${snapshotTs}`}
            alt="Camera snapshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{session.user_name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.test_name}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="shrink-0 text-xs">
            {isActive ? "Active" : "Ended"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {session.camera_enabled && <span className="flex items-center gap-1"><Camera className="w-3 h-3" />Cam</span>}
          {session.mic_enabled && <span className="flex items-center gap-1"><Mic className="w-3 h-3" />Mic</span>}
          {session.screen_enabled && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />Screen</span>}
          <span className="ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isActive ? elapsed(session.started_at) : "Ended"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SnapshotPanel({
  label,
  icon,
  url,
  enabled,
  ts,
}: {
  label: string;
  icon: React.ReactNode;
  url: string | null;
  enabled: boolean;
  ts: number;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border text-sm font-medium">
        {icon}
        {label}
        {!enabled && (
          <Badge variant="secondary" className="ml-auto text-xs">Not enabled</Badge>
        )}
      </div>
      <div className="aspect-video bg-muted flex items-center justify-center">
        {url && enabled ? (
          <img
            key={`${url}-${ts}`}
            src={`${url}?t=${ts}`}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-muted-foreground/40 flex flex-col items-center gap-2">
            {icon}
            <span className="text-xs">{enabled ? "Awaiting snapshot..." : "Not enabled"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function EventRow({ event }: { event: ProctoringEvent }) {
  const isAlert = ["tab_switch", "focus_loss", "fullscreen_exit", "permission_denied"].includes(event.event_type);
  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 ${isAlert ? "bg-yellow-500/5" : ""}`}>
      <div className="mt-0.5">{eventIcon(event.event_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{eventLabel(event.event_type)}</p>
        {event.event_data && Object.keys(event.event_data).length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {Object.entries(event.event_data)
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .join(" · ")}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTime(event.created_at)}
      </span>
    </div>
  );
}
