import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Megaphone, Trash2, Send, Pin, Bell, Share2 } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [postToFeed, setPostToFeed] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Stand-alone push notification
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushResult, setPushResult] = useState('');

  function load() {
    setLoading(true);
    api.getAnnouncements()
      .then((d: any) => setAnnouncements(d.announcements ?? []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handlePost() {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.postAnnouncement({ title: title.trim(), body: body.trim() });

      const msgs: string[] = ['✅ Announcement posted to app'];

      if (sendPush) {
        const r = await api.sendPushNotification({ title: title.trim(), body: body.trim() });
        msgs.push(`📲 Push sent to ${r.sent ?? 0} device${r.sent === 1 ? '' : 's'}`);
      }

      if (postToFeed) {
        await api.postAnnouncementToFeed({ content: `📣 ${title.trim()}\n\n${body.trim()}`, tag: 'GENERAL' });
        msgs.push('📰 Posted to social feed');
      }

      setSuccessMsg(msgs.join(' · '));
      setTitle('');
      setBody('');
      setSendPush(true);
      setPostToFeed(false);
      load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement? It will be removed from the app immediately.')) return;
    setDeleting(id);
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter((a: any) => a.id !== id));
    } catch {
      alert('Failed to delete. Try again.');
    } finally {
      setDeleting(null);
    }
  }

  async function handleSendPushOnly() {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setSendingPush(true);
    setPushResult('');
    try {
      const r = await api.sendPushNotification({ title: pushTitle.trim(), body: pushBody.trim() });
      setPushResult(`✅ Push sent to ${r.sent ?? 0} device${r.sent === 1 ? '' : 's'}`);
      setPushTitle('');
      setPushBody('');
    } catch (e: any) {
      setPushResult(`❌ ${e.message ?? 'Failed'}`);
    } finally {
      setSendingPush(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Megaphone size={15} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Announcements</h1>
          <p className="text-xs text-muted-foreground">Reach all players — app banner, push notification, and social feed</p>
        </div>
      </div>

      {/* ── Compose card ─────────────────────────────────────────────── */}
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Send size={11} />
          New Announcement
        </p>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          placeholder="Title  (e.g. 🎉 Multiplayer is Live!)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && document.getElementById('ann-body')?.focus()}
        />
        <textarea
          id="ann-body"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          rows={4}
          placeholder="Write the announcement here. Players will see this pinned in the Announcements tab."
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        {/* Delivery options */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked className="accent-primary" readOnly />
            <span className="text-xs text-muted-foreground">📌 Pin in app <span className="text-foreground font-medium">(always on)</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} className="accent-primary" />
            <span className="text-xs text-muted-foreground">📲 Send push notification to all devices</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={postToFeed} onChange={e => setPostToFeed(e.target.checked)} className="accent-primary" />
            <span className="text-xs text-muted-foreground">📰 Post to social feed as Chip Society</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</p>
        )}
        {successMsg && (
          <p className="text-xs text-green-400 bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-2">{successMsg}</p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Appears as <span className="text-foreground font-medium">📣 From Dev Team</span></p>
          <button
            onClick={handlePost}
            disabled={posting || !title.trim() || !body.trim()}
            className="flex items-center gap-2 bg-primary/10 border border-primary/40 hover:bg-primary/20 active:scale-95 text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Megaphone size={13} />
            {posting ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </div>

      {/* ── Stand-alone push notification ─────────────────────────────── */}
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Bell size={11} />
          Push Notification Only
        </p>
        <p className="text-xs text-muted-foreground">Send a push without pinning anything in the app (e.g. "Server back online").</p>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          placeholder="Notification title"
          value={pushTitle}
          onChange={e => setPushTitle(e.target.value)}
        />
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          placeholder="Notification body"
          value={pushBody}
          onChange={e => setPushBody(e.target.value)}
        />
        {pushResult && (
          <p className={`text-xs rounded-lg px-3 py-2 border ${pushResult.startsWith('✅') ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-destructive bg-destructive/10 border-destructive/30'}`}>{pushResult}</p>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSendPushOnly}
            disabled={sendingPush || !pushTitle.trim() || !pushBody.trim()}
            className="flex items-center gap-2 bg-primary/10 border border-primary/40 hover:bg-primary/20 active:scale-95 text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bell size={13} />
            {sendingPush ? 'Sending…' : 'Send Push'}
          </button>
        </div>
      </div>

      {/* ── Live announcements ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Pin size={11} />
            Live in App ({announcements.length})
          </p>
          {!loading && announcements.length > 0 && (
            <p className="text-xs text-muted-foreground">Newest first · click trash to remove</p>
          )}
        </div>

        {loading ? (
          <div className="bg-card border border-card-border rounded-xl p-6 text-center text-sm text-muted-foreground animate-pulse">
            Loading announcements…
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-10 text-center space-y-2">
            <Megaphone size={28} className="text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
            <p className="text-xs text-muted-foreground/60">Post one above — it'll appear in the app instantly.</p>
          </div>
        ) : (
          announcements.map((a: any) => (
            <div key={a.id} className="bg-card border border-card-border rounded-xl p-4 flex gap-4 items-start group">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{a.title}</span>
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/30 rounded px-1.5 py-0.5 font-semibold tracking-widest shrink-0">
                    📣 PINNED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                <p className="text-xs text-muted-foreground/50">
                  {new Date(a.createdAt).toLocaleString()} · {a.postedBy}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={async () => {
                    try {
                      await api.postAnnouncementToFeed({ content: `📣 ${a.title}\n\n${a.body}`, tag: 'GENERAL' });
                      alert('Posted to feed!');
                    } catch { alert('Failed to post to feed.'); }
                  }}
                  className="text-muted-foreground/40 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/10"
                  title="Post to social feed"
                >
                  <Share2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleting === a.id}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                  title="Delete announcement"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
