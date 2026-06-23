import { useState } from "react";
import { Spade, Lock } from "lucide-react";

export default function Login() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': key },
      });
      if (res.ok) {
        localStorage.setItem('admin_key', key);
        window.location.reload();
      } else {
        setError("Invalid admin key. Try again.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <Spade size={22} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-widest uppercase text-foreground">Chip Society</h1>
          <p className="text-xs text-muted-foreground tracking-wider mt-0.5">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock size={13} className="text-primary" />
            Enter admin key
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Admin key"
              className="w-full px-3 py-2.5 rounded-md bg-muted border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold tracking-wide disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
