import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bug, ChevronDown, RefreshCw, X } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  resolved:    "bg-green-500/15 text-green-400 border-green-500/30",
  dismissed:   "bg-muted text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-muted text-muted-foreground border-border",
};

const CATEGORIES: Record<string, string> = {
  crash: "💥 Crash", casino: "🃏 Casino", ui: "🎨 UI", account: "👤 Account", performance: "⚡ Perf", other: "💬 Other",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Pill({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${className}`}>
      {text}
    </span>
  );
}

function DetailModal({ report, onClose, onUpdated }: any) {
  const qc = useQueryClient();
  const [status, setStatus]     = useState(report.status);
  const [priority, setPriority] = useState(report.priority);
  const [notes, setNotes]       = useState(report.adminNotes ?? "");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      await api.updateBugReport(report.id, { status, priority, adminNotes: notes });
      qc.invalidateQueries({ queryKey: ["bug-reports"] });
      onUpdated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-card-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-card-border">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Pill text={CATEGORIES[report.category] ?? report.category} className={PRIORITY_STYLES[report.priority]} />
              <Pill text={report.status.replace("_", " ")} className={STATUS_STYLES[report.status]} />
              <Pill text={report.priority} className={PRIORITY_STYLES[report.priority]} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {report.username} · {formatDate(report.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="p-5 border-b border-card-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Description</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{report.description}</p>
        </div>

        {/* Device info */}
        {report.deviceInfo && Object.keys(report.deviceInfo).length > 0 && (
          <div className="p-5 border-b border-card-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Device</p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(report.deviceInfo as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="bg-muted rounded-md px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">{k}: </span>
                  <span className="text-foreground font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin controls */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Admin Actions</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Admin Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes, steps taken, resolution…"
              className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTERS = ["all", "open", "in_progress", "resolved", "dismissed"];
const CATEGORY_FILTERS = ["all", "crash", "casino", "ui", "account", "performance", "other"];

export default function BugReports() {
  const [statusFilter, setStatusFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected]             = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bug-reports", statusFilter, categoryFilter],
    queryFn: () => api.bugReports(statusFilter, categoryFilter),
    refetchInterval: 30_000,
  });

  const reports: any[] = data?.reports ?? [];
  const openCount = reports.filter((r: any) => r.status === "open").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bug size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Bug Reports</h1>
            <p className="text-xs text-muted-foreground">In-app reports from players</p>
          </div>
          {openCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  statusFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Category:</span>
          <div className="flex gap-1 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  categoryFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : (CATEGORIES[f] ?? f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : error ? (
        <div className="text-center py-16 text-destructive text-sm">Failed to load reports.</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bug size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No bug reports found</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Player</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any, i: number) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`border-b border-card-border/50 hover:bg-muted/40 cursor-pointer transition-colors ${
                    i === reports.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm">{CATEGORIES[r.category] ?? r.category}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-foreground font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{r.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{r.username}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Pill text={r.priority} className={PRIORITY_STYLES[r.priority] ?? ""} />
                  </td>
                  <td className="px-4 py-3">
                    <Pill text={r.status.replace("_", " ")} className={STATUS_STYLES[r.status] ?? ""} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => setSelected(null)}
        />
      )}
    </div>
  );
}
