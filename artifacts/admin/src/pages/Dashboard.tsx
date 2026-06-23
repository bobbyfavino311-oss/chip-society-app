import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Flag, ShieldAlert, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Link } from "wouter";

function Stat({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats().then(setStats).finally(() => setLoading(false));
  }, []);

  const p = stats?.players;
  const r = stats?.reports;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview at a glance</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Stat label="Total Players"    value={p?.total}     sub={`+${p?.newWeek} this week`}      icon={Users}       color="bg-primary/10 text-primary" />
            <Stat label="New Today"        value={p?.newToday}  sub="registered accounts"            icon={TrendingUp}  color="bg-accent/10 text-accent" />
            <Stat label="Active Accounts"  value={p?.active}    sub="in good standing"               icon={UserCheck}   color="bg-emerald-500/10 text-emerald-400" />
            <Stat label="Open Reports"     value={r?.open}      sub={`${r?.total} total reports`}    icon={Flag}        color="bg-destructive/10 text-destructive" />
            <Stat label="Banned"           value={p?.banned}    sub={`${p?.suspended} suspended`}    icon={ShieldAlert} color="bg-orange-500/10 text-orange-400" />
            <Stat label="Warned"           value={p?.warned}    sub="awaiting behaviour review"      icon={UserX}       color="bg-yellow-500/10 text-yellow-400" />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/reports">
              <div className="bg-card border border-card-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <Flag size={16} className="text-destructive" />
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Review Reports</span>
                </div>
                <p className="text-xs text-muted-foreground">{r?.open} open report{r?.open !== 1 ? 's' : ''} waiting for review</p>
              </div>
            </Link>
            <Link href="/players">
              <div className="bg-card border border-card-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Manage Players</span>
                </div>
                <p className="text-xs text-muted-foreground">Search, view, and manage all {p?.total} player accounts</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
