import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Flag, Clock, ExternalLink } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ResolveModal({ report, onClose, onDone }: any) {
  const [status, setStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.resolveReport(report.reportId, { status, resolution: resolution || undefined });
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-foreground mb-1">Resolve Report</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Reported: <span className="text-foreground font-medium">{report.reportedUsername}</span>
          {' · '}Reason: <span className="text-foreground capitalize">{report.reason}</span>
        </p>
        <form onSubmit={submit} className="space-y-3">
          <select value={status} onChange={e => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="resolved">Resolved — action taken</option>
            <option value="dismissed">Dismissed — no action</option>
          </select>
          <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Notes / resolution details (optional)"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<any>(null);

  function load() {
    setLoading(true);
    api.reports(statusFilter).then(r => {
      setReports(r.reports ?? []);
      setTotal(r.total ?? 0);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{total} report{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5">
        {['open', 'resolved', 'dismissed', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Report list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No {statusFilter !== 'all' ? statusFilter : ''} reports.
          </div>
        ) : reports.map(r => (
          <div key={r.reportId} className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Flag size={12} className={r.status === 'open' ? 'text-destructive' : 'text-muted-foreground'} />
                  <span className="text-sm font-semibold text-foreground capitalize">{r.reason}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                    r.status === 'open'      ? 'bg-destructive/15 text-destructive' :
                    r.status === 'resolved'  ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.status}</span>
                </div>

                <div className="text-xs text-muted-foreground mb-2">
                  <span className="text-foreground font-medium">{r.reporterUsername}</span>
                  {' '}reported{' '}
                  <Link href={`/players/${r.reportedId}`}>
                    <span className="text-primary hover:underline cursor-pointer font-medium">{r.reportedUsername}</span>
                  </Link>
                </div>

                {r.details && <p className="text-xs text-muted-foreground mb-2">{r.details}</p>}
                {r.resolution && <p className="text-xs text-accent">↳ {r.resolution}</p>}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={10} />
                  {formatDate(r.createdAt)}
                </div>
                <div className="flex gap-2">
                  <Link href={`/players/${r.reportedId}`}>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors">
                      <ExternalLink size={10} />
                      Profile
                    </button>
                  </Link>
                  {r.status === 'open' && (
                    <button onClick={() => setResolving(r)}
                      className="px-2.5 py-1 rounded text-xs bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-medium">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {resolving && (
        <ResolveModal
          report={resolving}
          onClose={() => setResolving(null)}
          onDone={() => { setResolving(null); load(); }}
        />
      )}
    </div>
  );
}
