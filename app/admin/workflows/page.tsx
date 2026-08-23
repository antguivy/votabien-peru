import { getWorkflows } from "./_lib/actions";
import { WorkflowTable } from "./_components/workflow-table";

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows de IA</h1>
        <p className="text-muted-foreground">
          Configura y gestiona los workflows que operan en los workflows de
          VotaBien.
        </p>
      </div>

      <WorkflowTable data={workflows} />
    </div>
  );
}
