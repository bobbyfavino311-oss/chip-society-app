import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { ChevronLeft, Coins, ShieldAlert, ShieldBan, ShieldX, ShieldCheck, Circle, Clock, Gift, Sparkles, TriangleAlert, History } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active:    'text-emerald-400',
  warned:    'text-yellow-400',
  suspended: 'text-orange-400',
  banned:    'text-destructive',
};

const BONUS_REASONS = [
  'Welcome Bonus', 'Loyalty Bonus', 'Bug Compensation',
  'Event Reward', 'Casino Gift', 'Admin Adjustment',
];

const WARN_REASONS = [
  'Inappropriate Content', 'Spam Posting', 'Harassment', 'Cheating Attempt',
  'Abusive Language', 'Exploiting Bugs', 'Other',
];

const SUSPEND_REASONS = [
  'Abusive Behavior', 'Repeated Violations', 'Cheating', 'Harassment',
  'Spam / Bot Activity', 'Exploiting Bugs', 'Other',
];

const BAN_REASONS = [
  'Severe Community Violation', 'Repeated Serious Offenses', 'Confirmed Cheating',
  'Fraud / Manipulation', 'Targeted Harassment', 'Other',
];

const DURATION_OPTIONS = [
  { label: '1 hour',   hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days',   hours: 168 },
  { label: '30 days',  hours: 720 },
];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function BonusModal({ playerId, username, currentBalance, onClose, onDone }: any) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(BONUS_REASONS[0]!);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ newBalance: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    const n = parseInt(amount);
    if (isNaN(n) || n <= 0) { setError('Amount must be a positive number'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.giveBonus(playerId, { amount: n, reason, message: message.trim() || undefined });
      setSuccess({ newBalance: res.newBalance });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-amber-500/40 rounded-xl p-6 w-full max-w-sm text-center shadow-lg shadow-amber-500/10">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Bonus Sent!</h3>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="text-amber-400 font-bold">+{parseInt(amount).toLocaleString()} chips</span> sent to <span className="text-foreground font-semibold">{username}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-5">New balance: <span className="text-foreground font-semibold">{success.newBalance.toLocaleString()}</span></p>
          <button onClick={onDone} className="w-full py-2.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-amber-500/30 rounded-xl p-6 w-full max-w-sm shadow-lg shadow-amber-500/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2"><Gift size={14} className="text-amber-400" />Give Casino Bonus</h3>
        <p className="text-xs text-muted-foreground mb-4">Current balance: <span className="text-foreground font-semibold">{Number(currentBalance).toLocaleString()}</span></p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Bonus Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500000"
              className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50" min="1" required />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[10000, 50000, 100000, 500000, 1000000].map(v => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/20 transition-colors">
                  {v >= 1000000 ? `${v/1000000}M` : `${v/1000}K`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Reason / Category</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50">
              {BONUS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Message <span className="text-muted-foreground/60">(optional)</span></label>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Thanks for helping test the beta."
              className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/30 transition-colors">
              {loading ? 'Sending…' : '🎰 Give Bonus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
    try { await api.adjustChips(playerId, { type, amount: parseInt(amount), note }); onDone(); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Coins size={14} className="text-primary" />Chip Adjustment</h3>
        <p className="text-xs text-muted-foreground mb-4">Current balance: <span className="text-foreground font-semibold">{Number(currentBalance).toLocaleString()}</span></p>
        <form onSubmit={submit} className="space-y-3">
          <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="refund">Refund</option><option value="bonus">Bonus</option>
            <option value="deduction">Deduction</option><option value="adjustment">Manual adjustment</option>
          </select>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" min="1" required />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason / note (required)"
            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
              {loading ? 'Saving…' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WarnModal({ playerId, username, onClose, onDone }: any) {
  const [reason, setReason] = useState(WARN_REASONS[0]!);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.warn(playerId, { reason, message: message.trim() || undefined });
      setSuccess(true);
      setTimeout(() => { onDone(res.online); }, 1500);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-yellow-500/40 rounded-xl p-6 w-full max-w-sm shadow-lg shadow-yellow-500/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-yellow-400 mb-1 flex items-center gap-2"><TriangleAlert size={14} />Warn Player</h3>
        <p className="text-xs text-muted-foreground mb-4">Issuing a warning to <span className="text-foreground font-semibold">{username}</span>. They will receive an in-app notification immediately if online.</p>
        {success ? (
          <div className="text-center py-4">
            <p className="text-yellow-400 font-bold text-sm">⚠️ Warning Issued</p>
            <p className="text-xs text-muted-foreground mt-1">Player has been notified.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-yellow-500/50">
                {WARN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Message to player <span className="text-muted-foreground/60">(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Please keep posts respectful and follow community guidelines."
                className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-yellow-500/50 resize-none" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-semibold disabled:opacity-40 hover:bg-yellow-500/30 transition-colors">
                {loading ? 'Sending…' : '⚠️ Issue Warning'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SuspendModal({ playerId, username, onClose, onDone }: any) {
  const [reason, setReason] = useState(SUSPEND_REASONS[0]!);
  const [message, setMessage] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [customHours, setCustomHours] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ expiresAt: string; online: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const hours = useCustom ? parseInt(customHours) : durationHours;
    if (!hours || hours < 1) { setError('Invalid duration'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.suspend(playerId, { reason, message: message.trim() || undefined, durationHours: hours });
      setResult({ expiresAt: res.expiresAt, online: res.online });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-orange-500/40 rounded-xl p-6 w-full max-w-sm shadow-lg shadow-orange-500/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-orange-400 mb-1 flex items-center gap-2"><ShieldBan size={14} />Suspend Player</h3>
        <p className="text-xs text-muted-foreground mb-4">Suspending <span className="text-foreground font-semibold">{username}</span>. They will be disconnected immediately if online.</p>
        {result ? (
          <div className="text-center py-2">
            <p className="text-orange-400 font-bold text-sm mb-1">⛔ Suspension Applied</p>
            <p className="text-xs text-muted-foreground">Expires: {formatDate(result.expiresAt)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{result.online ? 'Player was online and has been notified.' : 'Player was offline — notification stored.'}</p>
            <button onClick={() => onDone()} className="mt-4 w-full py-2 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-400 text-sm font-semibold hover:bg-orange-500/30 transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Duration</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.hours} type="button" onClick={() => { setDurationHours(opt.hours); setUseCustom(false); }}
                    className={`py-1.5 rounded text-xs font-medium border transition-colors ${!useCustom && durationHours === opt.hours ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setUseCustom(v => !v)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${useCustom ? 'border-orange-500/40 text-orange-400 bg-orange-500/10' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  Custom
                </button>
                {useCustom && (
                  <input type="number" value={customHours} onChange={e => setCustomHours(e.target.value)} placeholder="Hours" min="1"
                    className="flex-1 px-2 py-1 rounded bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/50" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/50">
                {SUSPEND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Message <span className="text-muted-foreground/60">(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Please review community guidelines before returning."
                className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-400 text-sm font-semibold disabled:opacity-40 hover:bg-orange-500/30 transition-colors">
                {loading ? 'Suspending…' : '⛔ Suspend'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function BanModal({ playerId, username, onClose, onDone }: any) {
  const [reason, setReason] = useState(BAN_REASONS[0]!);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== username) { setError(`Type "${username}" to confirm`); return; }
    setLoading(true); setError('');
    try {
      await api.ban(playerId, { reason, message: message.trim() || undefined });
      setSuccess(true);
      setTimeout(() => onDone(), 1500);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-destructive/40 rounded-xl p-6 w-full max-w-sm shadow-lg shadow-destructive/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-destructive mb-1 flex items-center gap-2"><ShieldX size={14} />Permanently Ban Player</h3>
        <p className="text-xs text-muted-foreground mb-4">This will <span className="text-destructive font-semibold">permanently disable</span> the account for <span className="text-foreground font-semibold">{username}</span>. This cannot be undone without admin action.</p>
        {success ? (
          <div className="text-center py-4">
            <p className="text-destructive font-bold text-sm">🚫 Account Banned</p>
            <p className="text-xs text-muted-foreground mt-1">Player has been permanently banned.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50">
                {BAN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Message <span className="text-muted-foreground/60">(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="This account has been permanently banned for violating community guidelines."
                className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Type <span className="text-foreground font-semibold">{username}</span> to confirm</label>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={username}
                className="w-full px-3 py-2 rounded-md bg-muted border border-destructive/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={loading || confirm !== username}
                className="flex-1 py-2 rounded-md bg-destructive/20 border border-destructive/40 text-destructive text-sm font-semibold disabled:opacity-40 hover:bg-destructive/30 transition-colors">
                {loading ? 'Banning…' : '🚫 Ban Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const MOD_TYPE_STYLE: Record<string, string> = {
  warning:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  suspension:'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ban:       'bg-destructive/10 text-destructive border-destructive/20',
  unban:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function PlayerDetail() {
  const [, params] = useRoute('/players/:id');
  const id = params?.id ?? '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modHistory, setModHistory] = useState<any[]>([]);
  const [showBonus, setShowBonus] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showBan, setShowBan] = useState(false);
  const [founderLoading, setFounderLoading] = useState(false);

  function load() {
    setLoading(true);
    api.player(id)
      .then(playerData => {
        setData(playerData);
        return api.moderationHistory().then(modData => {
          setModHistory((modData.actions ?? []).filter((a: any) => a.playerId === id));
        }).catch(() => {
          setModHistory([]);
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (id) load(); }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  if (!data?.player) return <div className="p-8 text-muted-foreground text-sm">Player not found.</div>;

  const { player, transactions, reports } = data;
  const profile = player.profileJson ?? {};
  const chips = typeof profile.chips === 'number' ? profile.chips : 0;
  const isSanctioned = player.status === 'suspended' || player.status === 'banned';

  async function handleUnban() {
    try { await api.unban(id); load(); } catch { /* ignore */ }
  }

  async function handleUnwarn() {
    try { await api.unwarn(id); load(); } catch { /* ignore */ }
  }

  async function handleToggleFounder() {
    const current = !!(data?.player?.profileJson?.isFounder);
    setFounderLoading(true);
    try { await api.toggleFounder(id, !current); load(); } catch { /* ignore */ }
    finally { setFounderLoading(false); }
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/players">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6 w-fit">
          <ChevronLeft size={13} />Back to Players
        </div>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{player.username}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{player.email || 'No email'}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Circle size={6} fill="currentColor" className={STATUS_COLORS[player.status] ?? 'text-muted-foreground'} />
              <span className={`text-xs font-medium capitalize ${STATUS_COLORS[player.status]}`}>{player.status}</span>
            </div>
            {player.banReason && <span className="text-xs text-muted-foreground">— {player.banReason}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleToggleFounder}
            disabled={founderLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-semibold transition-colors disabled:opacity-50 ${
              profile.isFounder
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            👑 {profile.isFounder ? 'Remove Founder' : 'Grant Founder'}
          </button>
          <button onClick={() => setShowBonus(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors">
            <Gift size={12} />Casino Bonus
          </button>
          <button onClick={() => setShowChips(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
            <Coins size={12} />Adjust Chips
          </button>
          <button onClick={() => setShowWarn(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors">
            <TriangleAlert size={12} />Warn
          </button>
          <button onClick={() => setShowSuspend(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors">
            <ShieldBan size={12} />Suspend
          </button>
          {player.status === 'warned' && (
            <button onClick={handleUnwarn}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/20 transition-colors">
              <ShieldCheck size={12} />Clear Warning
            </button>
          )}
          {player.status !== 'warned' && !isSanctioned ? (
            <button onClick={() => setShowBan(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors">
              <ShieldX size={12} />Ban
            </button>
          ) : player.status !== 'warned' ? (
            <button onClick={handleUnban}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
              <ShieldCheck size={12} />Restore
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Chips', value: chips.toLocaleString() },
          { label: 'XP',    value: (profile.xp as number ?? 0).toLocaleString() },
          { label: 'Rank',  value: profile.rank as string ?? '—' },
          { label: 'Wins',  value: String(profile.wins ?? 0) },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Moderation History */}
      <div className="bg-card border border-card-border rounded-xl mb-5">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History size={13} className="text-orange-400" />
            Moderation History
            <span className="text-xs text-muted-foreground font-normal ml-1">{modHistory.length} action{modHistory.length !== 1 ? 's' : ''}</span>
          </h2>
        </div>
        {modHistory.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted-foreground">No moderation actions on record.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Reason</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Message</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {modHistory.map((a: any, i: number) => (
                <tr key={a.id} className={i < modHistory.length - 1 ? 'border-b border-border/30' : ''}>
                  <td className="px-5 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${MOD_TYPE_STYLE[a.type] ?? 'bg-muted text-muted-foreground border-border'}`}>{a.type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{a.reason}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{a.message ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{a.durationHours ? `${a.durationHours}h` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Chip history */}
      <div className="bg-card border border-card-border rounded-xl mb-5">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Coins size={13} className="text-primary" />Chip Transactions<span className="text-xs text-muted-foreground font-normal ml-1">last 50</span>
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
                  <td className={`px-5 py-2.5 capitalize text-xs font-medium ${tx.type === 'bonus' ? 'text-amber-400' : 'text-foreground'}`}>{tx.type}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>{tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{tx.balanceAfter.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{tx.note}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reports */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><ShieldAlert size={13} className="text-destructive" />Reports Filed Against This Player</h2>
        </div>
        {reports.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted-foreground">No reports.</p>
        ) : reports.map((r: any, i: number) => (
          <div key={r.reportId} className={`px-5 py-4 ${i < reports.length - 1 ? 'border-b border-border/40' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground capitalize">{r.reason}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${r.status === 'open' ? 'bg-destructive/15 text-destructive' : r.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                </div>
                {r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}
                {r.resolution && <p className="text-xs text-accent mt-1">Resolution: {r.resolution}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap"><Clock size={10} />{formatDate(r.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      {showBonus && <BonusModal playerId={id} username={player.username} currentBalance={chips} onClose={() => setShowBonus(false)} onDone={() => { setShowBonus(false); load(); }} />}
      {showChips && <ChipModal playerId={id} currentBalance={chips} onClose={() => setShowChips(false)} onDone={() => { setShowChips(false); load(); }} />}
      {showWarn && <WarnModal playerId={id} username={player.username} onClose={() => setShowWarn(false)} onDone={() => { setShowWarn(false); load(); }} />}
      {showSuspend && <SuspendModal playerId={id} username={player.username} onClose={() => setShowSuspend(false)} onDone={() => { setShowSuspend(false); load(); }} />}
      {showBan && <BanModal playerId={id} username={player.username} onClose={() => setShowBan(false)} onDone={() => { setShowBan(false); load(); }} />}
    </div>
  );
}
