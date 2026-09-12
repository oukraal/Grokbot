import { RUNTIMES } from "@/lib/spark/runtimes";
import { useSpark } from "@/lib/spark/store";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const STATUS: Record<string, { label: string; variant: "default" | "live" | "warn" | "solid" }> = {
  missing: { label: "Not installed", variant: "default" },
  installing: { label: "Installing", variant: "warn" },
  ready: { label: "Ready", variant: "solid" },
  running: { label: "Running", variant: "live" },
};

export function RuntimesView() {
  const runtimes = useSpark((s) => s.runtimes);
  const installRuntime = useSpark((s) => s.installRuntime);
  const jobs = useSpark((s) => s.jobs);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs tracking-[0.18em] text-subtle uppercase">Stack</p>
        <h1 className="text-2xl font-medium tracking-tight">Runtimes</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          DGX OS already has CUDA 13 and the NVIDIA container runtime. These are the inference layers you add on top.
        </p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {RUNTIMES.map((r) => {
          const st = runtimes.find((x) => x.id === r.id)?.status ?? "missing";
          const badge = STATUS[st];
          const busy = jobs.some(
            (j) =>
              (j.status === "running" || j.status === "queued") &&
              j.title.toLowerCase().includes(r.name.toLowerCase()),
          );
          return (
            <li
              key={r.id}
              className="flex flex-col rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-subtle">{r.role}</p>
                </div>
                <Badge variant={badge.variant}>{busy ? "Working" : badge.label}</Badge>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{r.summary}</p>
              <p className="mt-3 font-mono text-xs text-subtle">{r.endpoint}</p>
              <div className="mt-4">
                {st === "missing" ? (
                  <Button size="sm" variant="secondary" onClick={() => installRuntime(r.id)}>
                    Install
                  </Button>
                ) : (
                  <p className="text-xs text-live">On the box</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
