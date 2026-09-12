import { PLAYBOOK_IDS, playbookMeta } from "@/lib/spark/playbooks";
import { useSpark } from "@/lib/spark/store";
import { Button } from "./ui/button";

export function PlaybooksView() {
  const runPlaybook = useSpark((s) => s.runPlaybook);
  const resetTwin = useSpark((s) => s.resetTwin);
  const busy = useSpark((s) => s.jobs.some((j) => j.status === "running" || j.status === "queued"));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs tracking-[0.18em] text-subtle uppercase">Recipes</p>
        <h1 className="text-2xl font-medium tracking-tight">Playbooks</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          One-shot stacks for this GB10. The operator can run the same recipes from chat.
        </p>
      </header>
      <ul className="grid gap-3">
        {PLAYBOOK_IDS.map((id) => {
          const meta = playbookMeta(id);
          const isReset = id === "reset";
          return (
            <li
              key={id}
              className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="max-w-xl">
                <p className="text-sm font-medium">{meta.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
                <p className="mt-2 text-xs text-subtle">{meta.minutes}</p>
              </div>
              <Button
                variant={isReset ? "outline" : "default"}
                size="sm"
                className="shrink-0"
                disabled={busy && !isReset}
                onClick={() => (isReset ? resetTwin() : runPlaybook(id))}
              >
                {isReset ? "Reset twin" : "Run"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
