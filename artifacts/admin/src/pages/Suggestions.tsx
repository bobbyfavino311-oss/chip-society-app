import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lightbulb, RefreshCw, Send, X } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  approved:    "bg-green-500/15 text-green-400 border-green-500/30",
  rejected:    "bg-muted text-muted-foreground border-border",
  announced:   "bg-primary/15 text-primary border-primary/30",
};

const STATUS_FILTERS = ["all", "open", "in_progress", "approved", "rejected", "announced"];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayStatus(status: string) {
  return status.replace("_", " ");
}

function Pill({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${className}`}>
      {text}
    </span>
  );
}

function suggestionTitle(suggestion: any) {
  return suggestion.title ?? suggestion.subject ?? suggestion.summary ?? "Untitled suggestion";
}

function suggestionBody(suggestion: any) {
  return suggestion.description ?? suggestion.content ?? suggestion.body ?? "No description provided.";
}

function suggestionAuthor(suggestion: any) {
  return suggestion.username ?? suggestion.authorUsername ?? suggestion.playerUsername ?? "Anonymous";
}

function DetailModal({
  suggestion,
  onClose,
  onUpdated,
}: {
  suggestion: any;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(suggestion.status ?? "open");
  const [notes, setNotes] = useState(suggestion.adminNotes ?? "");
  const [announcementTitle, setAnnouncementTitle] = useState(
    suggestion.announcementTitle ?? suggestionTitle(suggestion),
  );
  const [announcementBody, setAnnouncementBody] = useState(
    suggestion.announcementBody ?? suggestionBody(suggestion),
  );
  const [saving, setSaving] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [error, setError] = useState("");
  const [announcementSuccess, setAnnouncementSuccess] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.updateSuggestion(
        suggestion.id,
        suggestion.status === "announced" ? { adminNotes: notes } : { status, adminNotes: notes },
      );
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      onUpdated();
    } catch (e: any) {
      setError(e.message ?? "Failed to save suggestion");
    } finally {
      setSaving(false);
    }
  }

  async function announce() {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    setAnnouncing(true);
    setError("");
    setAnnouncementSuccess("");
    try {
      await api.announceSuggestion(suggestion.id, {
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setAnnouncementSuccess("Announcement posted successfully.");
      onUpdated();
    } catch (e: any) {
      setError(e.message ?? "Failed to announce suggestion");
    } finally {
      setAnnouncing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-card-border rounded-xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-card-border">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Pill
                text={displayStatus(suggestion.status ?? "open")}
                className={STATUS_STYLES[suggestion.status] ?? STATUS_STYLES.open}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{suggestionTitle(suggestion)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {suggestionAuthor(suggestion)} · {formatDate(suggestion.createdAt)}
            </p>
          </div>
          <button
            type="button"
            data-testid="button-close-suggestion"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Close suggestion details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 border-b border-card-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
            Suggestion
          </p>
          <p data-testid="text-suggestion-description" className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {suggestionBody(suggestion)}
          </p>
        </div>

        {suggestion.deviceInfo && Object.keys(suggestion.deviceInfo).length > 0 && (
          <div className="p-5 border-b border-card-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
              Device
            </p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(suggestion.deviceInfo as Record<string, unknown>).map(([key, value]) => (
                <div key={key} className="bg-muted rounded-md px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">{key}: </span>
                  <span className="text-foreground font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Admin Actions
          </p>

          <div>
            <label htmlFor="suggestion-status" className="text-xs text-muted-foreground mb-1 block">
              Status
            </label>
            <select
              id="suggestion-status"
              data-testid="select-suggestion-status"
              value={status}
              onChange={event => setStatus(event.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={suggestion.status === "announced"}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              {suggestion.status === "announced" && <option value="announced">Announced</option>}
            </select>
          </div>

          <div>
            <label htmlFor="suggestion-notes" className="text-xs text-muted-foreground mb-1 block">
              Internal Notes
            </label>
            <textarea
              id="suggestion-notes"
              data-testid="textarea-suggestion-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              rows={3}
              placeholder="Internal notes for the admin team…"
              className="w-full px-3 py-2 rounded-md bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {suggestion.status === "approved" && (
            <div className="border border-green-500/25 bg-green-500/5 rounded-lg p-3 space-y-3">
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Publish as announcement
              </p>
              <input
                data-testid="input-suggestion-announcement-title"
                value={announcementTitle}
                onChange={event => setAnnouncementTitle(event.target.value)}
                placeholder="Announcement title"
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <textarea
                data-testid="textarea-suggestion-announcement-body"
                value={announcementBody}
                onChange={event => setAnnouncementBody(event.target.value)}
                rows={4}
                placeholder="Announcement body"
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <button
                type="button"
                data-testid="button-announce-suggestion"
                onClick={announce}
                disabled={announcing || !announcementTitle.trim() || !announcementBody.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-green-500/15 border border-green-500/35 text-green-400 text-sm font-semibold hover:bg-green-500/25 disabled:opacity-40 transition-colors"
              >
                <Send size={13} />
                {announcing ? "Posting…" : "Announce Suggestion"}
              </button>
              {announcementSuccess && (
                <p data-testid="status-suggestion-announcement-success" className="text-xs text-green-400">
                  {announcementSuccess}
                </p>
              )}
            </div>
          )}

          {error && (
            <p data-testid="status-suggestion-error" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              data-testid="button-cancel-suggestion"
              onClick={onClose}
              className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="button-save-suggestion"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Suggestions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["suggestions", statusFilter],
    queryFn: () => api.getSuggestions(statusFilter),
    refetchInterval: 30_000,
  });

  const suggestions: any[] = data?.suggestions ?? [];
  const openCount = suggestions.filter(suggestion => suggestion.status === "open").length;

  function closeAfterUpdate() {
    setSelected(null);
    queryClient.invalidateQueries({ queryKey: ["suggestions"] });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Suggestions</h1>
            <p className="text-xs text-muted-foreground">Review ideas submitted by players</p>
          </div>
          {openCount > 0 && (
            <span data-testid="status-open-suggestions" className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
              {openCount} open
            </span>
          )}
        </div>
        <button
          type="button"
          data-testid="button-refresh-suggestions"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground">Status:</span>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(filter => (
            <button
              type="button"
              key={filter}
              data-testid={`button-filter-suggestions-${filter}`}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {displayStatus(filter)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading suggestions…</div>
      ) : error ? (
        <div data-testid="status-suggestions-error" className="text-center py-16 text-destructive text-sm">
          Failed to load suggestions.
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Lightbulb size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No suggestions found</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Player</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr
                  key={suggestion.id}
                  data-testid={`row-suggestion-${suggestion.id}`}
                  onClick={() => setSelected(suggestion)}
                  className={`border-b border-card-border/50 hover:bg-muted/40 cursor-pointer transition-colors ${
                    index === suggestions.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3 max-w-[420px]">
                    <p data-testid={`text-suggestion-title-${suggestion.id}`} className="text-foreground font-medium truncate">
                      {suggestionTitle(suggestion)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{suggestionBody(suggestion)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{suggestionAuthor(suggestion)}</td>
                  <td className="px-4 py-3">
                    <Pill
                      text={displayStatus(suggestion.status ?? "open")}
                      className={STATUS_STYLES[suggestion.status] ?? STATUS_STYLES.open}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(suggestion.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          suggestion={selected}
          onClose={() => setSelected(null)}
          onUpdated={closeAfterUpdate}
        />
      )}
    </div>
  );
}