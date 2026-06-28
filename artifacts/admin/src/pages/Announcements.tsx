import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Megaphone, Trash2, Send, Pin } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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
    try {
      await api.postAnnouncement({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Megaphone size={15} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Announcements</h1>
          <p className="text-xs text-muted-foreground">Posts appear pinned in the app's Announcements tab, marked 📣 From Dev Team</p>
        </div>
      </div>

      {/* Compose card */}
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
          placeholder="Write the announcement here. Players will see this in the Announcements tab."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Will appear as <span className="text-foreground font-medium">📣 From Dev Team</span> in the mobile app</p>
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

      {/* Live announcements */}
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
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deleting === a.id}
                className="text-muted-foreground/30 hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100"
                title="Delete announcement"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
