import {
  Box,
  Layers,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  ScrollText,
  X,
} from "lucide-react";
import { AgentPanel } from "./agent-panel";
import { JobsView } from "./jobs-view";
import { Mark } from "./mark";
import { ModelsView } from "./models-view";
import { Overview } from "./overview";
import { PlaybooksView } from "./playbooks-view";
import { RuntimesView } from "./runtimes-view";
import { SparkProvider } from "./spark-provider";
import { Button } from "./ui/button";
import { useSpark } from "@/lib/spark/store";
import { fmtGb, fmtPct } from "@/lib/utils";
import type { ViewId } from "@/lib/spark/types";
import { cn } from "@/lib/utils";

const NAV: { id: ViewId; label: string; icon: typeof Box }[] = [
  { id: "overview", label: "Device", icon: LayoutDashboard },
  { id: "models", label: "Models", icon: Layers },
  { id: "runtimes", label: "Runtimes", icon: Box },
  { id: "playbooks", label: "Playbooks", icon: ScrollText },
  { id: "jobs", label: "Jobs", icon: ListTodo },
];

export function Shell() {
  return (
    <SparkProvider>
      <ShellInner />
    </SparkProvider>
  );
}

function ShellInner() {
  const view = useSpark((s) => s.view);
  const setView = useSpark((s) => s.setView);
  const agentOpen = useSpark((s) => s.agentOpen);
  const setAgentOpen = useSpark((s) => s.setAgentOpen);
  const gpu = useSpark((s) => s.telemetry.gpuUtil);
  const mem = useSpark((s) => s.telemetry.memUsedGb);
  const memTotal = useSpark((s) => s.telemetry.memTotalGb);
  const status = useSpark((s) => s.device.status);
  const running = useSpark((s) => s.jobs.filter((j) => j.status === "running" || j.status === "queued").length);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Mark className="size-7" />
          <div>
            <p className="text-sm font-medium tracking-tight">Sparkforge</p>
            <p className="hidden text-xs tracking-widest text-subtle uppercase sm:block">
              DGX Spark operator
            </p>
          </div>
        </div>
        <div className="ml-auto hidden items-center gap-4 font-mono text-xs tabular text-muted-foreground md:flex">
          <span className="flex items-center gap-2">
            <span className="live-dot" />
            {status === "busy" ? "Busy" : "Online"}
          </span>
          <span>GPU {fmtPct(gpu)}</span>
          <span>
            {fmtGb(mem)} / {fmtGb(memTotal)}
          </span>
          {running > 0 ? <span className="text-primary">{running} job{running > 1 ? "s" : ""}</span> : null}
        </div>
        <Button
          size="sm"
          variant={agentOpen ? "secondary" : "default"}
          className="ml-auto md:ml-4"
          onClick={() => setAgentOpen(!agentOpen)}
        >
          <MessageSquare />
          <span className="hidden sm:inline">Operator</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-48 shrink-0 flex-col gap-1 border-r border-border p-3 lg:flex">
          {NAV.map((n) => (
            <NavBtn key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id)} />
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 pb-24 lg:px-8 lg:pb-8">
          {view === "overview" ? <Overview /> : null}
          {view === "models" ? <ModelsView /> : null}
          {view === "runtimes" ? <RuntimesView /> : null}
          {view === "playbooks" ? <PlaybooksView /> : null}
          {view === "jobs" ? <JobsView /> : null}
        </main>

        {agentOpen ? (
          <div className="hidden w-96 shrink-0 lg:block">
            <AgentPanel />
          </div>
        ) : null}
      </div>

      {agentOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/70"
            aria-label="Dismiss operator"
            onClick={() => setAgentOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-xl bg-card shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
            <div className="flex justify-end px-2 pt-2">
              <Button size="icon-sm" variant="ghost" onClick={() => setAgentOpen(false)} aria-label="Close">
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <AgentPanel />
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/95 px-1 py-1 lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setView(n.id)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs",
              view === n.id ? "text-foreground" : "text-subtle",
            )}
          >
            <n.icon className="size-4" />
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavBtn({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: ViewId;
  label: string;
  icon: typeof Box;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-lg px-3 text-sm",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
