import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Flag, LogOut, Spade } from "lucide-react";

const nav = [
  { href: "/",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Players",   icon: Users },
  { href: "/reports", label: "Reports",   icon: Flag },
];

export default function Sidebar() {
  const [loc] = useLocation();

  function logout() {
    localStorage.removeItem('admin_key');
    window.location.reload();
  }

  return (
    <aside className="w-56 flex flex-col border-r border-sidebar-border bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Spade size={14} className="text-primary" />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground tracking-widest uppercase">Chip Society</div>
          <div className="text-[10px] text-muted-foreground tracking-wider">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? loc === '/' : loc.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-sm transition-colors ${
                active
                  ? 'bg-sidebar-accent text-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
              }`}>
                <Icon size={15} className={active ? 'text-primary' : 'text-muted-foreground'} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md w-full text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
