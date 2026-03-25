import { AppShell } from "../components/navigation/app-shell";
import { DashboardWorkspace } from "../components/dashboard/dashboard-workspace";

export default function HomePage() {
  return (
    <AppShell>
      <DashboardWorkspace />
    </AppShell>
  );
}
