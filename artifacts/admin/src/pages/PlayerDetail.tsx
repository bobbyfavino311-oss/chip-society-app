import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { ChevronLeft, Coins, ShieldAlert, Circle, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active:    'text-emerald-400',
  warned:    'text-yellow-400',
  suspended: 'text-orange-400',
  banned:    'text-destructive',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ChipModal({ playerId, currentBalance, onClose, onDone }: any) {
  const [type, setType] = useState<'refund' | 'bonus' | 'deduction' | 'adjustment'>('refund');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !note) return;
    setLoading(true); setError('');
    try {
      await api.adjustChips(playerId, { type, amount: parseInt(amount), note });
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
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Coins size={14} className="text-primary" />
          Chip Adjustment
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Current balance: <span className="text-foreground font-semibold">{Number(currentBalance).toLocaleString()}</span></p>
        <form onSubmit={submit} className="space-y-3">
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="refund">Refund</option>
            <option value="bonus">Bonus</option>
            <option value="deduction">Deduction</option>
            <option value="adjustment">Manual adjustment</option>
          </select>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" min="1" required />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason / note (required)"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
              {loading ? 'Saving…' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusModal({ playerId, currentStatus, onClose, onDone }: any) {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.setStatus(playerId, { status, reason: reason || undefined });
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
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert size={14} className="text-destructive" />
          Update Account Status
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="active">Active</option>
            <option value="warned">Warned</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
              {loading ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlayerDetail() {
  const [, params] = useRoute('/players/:id');
  const id = params?.id ?? '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChips, setShowChips] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  function load() {
    setLoading(true);
    api.player(id).then(setData).finally(() => setLoading(false));
  }

  useEffect(() => { if (id) load(); }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  if (!data?.player) return <div className="p-8 text-muted-foreground text-sm">Player not found.</div>;

  const { player, transactions, reports } = data;
  const profile = player.profileJson ?? {};
  const chips = typeof profile.chips === 'number' ? profile.chips : 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link href="/players">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6 w-fit">
          <ChevronLeft size={13} />
          Back to Players
        </div>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{player.username}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{player.email || 'No email'}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Circle size={6} fill="currentColor" className={STATUS_COLORS[player.status] ?? 'text-muted-foreground'} />
            <span className={`text-xs font-medium capitalize ${STATUS_COLORS[player.status]}`}>{player.status}</span>
            {player.banReason && <span className="text-xs text-muted-foreground">— {player.banReason}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChips(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
            <Coins size={12} />
            Chips
          </button>
          <button onClick={() => setShowStatus(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors">
            <ShieldAlert size={12} />
            Status
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Chips',    value: chips.toLocaleString() },
          { label: 'XP',       value: (profile.xp as number ?? 0).toLocaleString() },
          { label: 'Rank',     value: profile.rank as string ?? '—' },
          { label: 'Wins',     value: String(profile.wins ?? 0) },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chip history */}
      <div className="bg-card border border-card-border rounded-xl mb-5">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Coins size={13} className="text-primary" />
            Chip Transactions
            <span className="text-xs text-muted-foreground font-normal ml-1">last 50</span>
          </h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Balance after</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Note</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any, i: number) => (
                <tr key={tx.txId} className={i < transactions.length - 1 ? 'border-b border-border/30' : ''}>
                  <td className="px-5 py-2.5 capitalize text-foreground text-xs font-medium">{tx.type}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{tx.balanceAfter.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{tx.note}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reports against this player */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert size={13} className="text-destructive" />
            Reports Filed Against This Player
          </h2>
        </div>
        {reports.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted-foreground">No reports.</p>
        ) : reports.map((r: any, i: number) => (
          <div key={r.reportId} className={`px-5 py-4 ${i < reports.length - 1 ? 'border-b border-border/40' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground capitalize">{r.reason}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                    r.status === 'open' ? 'bg-destructive/15 text-destructive' :
                    r.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.status}</span>
                </div>
                {r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}
                {r.resolution && <p className="text-xs text-accent mt-1">Resolution: {r.resolution}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock size={10} />
                {formatDate(r.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showChips && (
        <ChipModal
          playerId={id}
          currentBalance={chips}
          onClose={() => setShowChips(false)}
          onDone={() => { setShowChips(false); load(); }}
        />
      )}
      {showStatus && (
        <StatusModal
          playerId={id}
          currentStatus={player.status}
          onClose={() => setShowStatus(false)}
          onDone={() => { setShowStatus(false); load(); }}
        />
      )}
    </div>
  );
}
