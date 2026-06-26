import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Players from "@/pages/Players";
import PlayerDetail from "@/pages/PlayerDetail";
import Reports from "@/pages/Reports";
import BugReports from "@/pages/BugReports";
import Sidebar from "@/components/Sidebar";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function useAdminKey() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin_key') : null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function AuthGate() {
  const key = useAdminKey();
  const [loc] = useLocation();

  if (!key) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/players" component={Players} />
        <Route path="/players/:id" component={PlayerDetail} />
        <Route path="/reports" component={Reports} />
        <Route path="/bugs" component={BugReports} />
        <Route>
          <div className="p-8 text-muted-foreground">Page not found.</div>
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthGate />
      </WouterRouter>
    </QueryClientProvider>
  );
}
