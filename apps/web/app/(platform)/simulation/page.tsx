import { AppShell } from "../../../components/navigation/app-shell";
import { SimulationWorkspace } from "../../../components/simulation/simulation-workspace";

export default function SimulationPage() {
  return (
    <AppShell>
      <SimulationWorkspace />
    </AppShell>
  );
}
