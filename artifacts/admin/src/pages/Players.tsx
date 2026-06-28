import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Search, ChevronRight, Circle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active:    'text-emerald-400',
  warned:    'text-yellow-400',
  suspended: 'text-orange-400',
  banned:    'text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', warned: 'Warned', suspended: 'Suspended', banned: 'Banned',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatChips(p: any) {
  const chips = p?.profileJson?.chips;
  if (chips == null) return '—';
  return Number(chips).toLocaleString();
}

export default function Players() {
  const [players, setPlayers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.players(q, status).then(r => {
      setPlayers(r.players ?? []);
      setTotal(r.total ?? 0);
    }).finally(() => setLoading(false));
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Players</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{total} account{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search username or email…"
            className="w-full pl-8 pr-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="warned">Warned</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Player</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Chips</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
            ) : players.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No players found.</td></tr>
            ) : players.map((p, i) => (
              <tr key={p.playerId} className={`hover:bg-muted/40 transition-colors ${i < players.length - 1 ? 'border-b border-border/60' : ''}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{p.username}</span>
                    {p.profileJson?.isFounder && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-yellow-500/15 border border-yellow-500/30 text-yellow-300">
                        👑 FOUNDER
                      </span>
                    )}
                  </div>
                  {p.email && <div className="text-xs text-muted-foreground mt-0.5">{p.email}</div>}
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-foreground">{formatChips(p)}</td>
                <td className="px-4 py-3.5">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? 'text-muted-foreground'}`}>
                    <Circle size={6} fill="currentColor" />
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Link href={`/players/${p.playerId}`}>
                    <ChevronRight size={15} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer ml-auto" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
