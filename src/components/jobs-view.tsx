import { useSpark } from "@/lib/spark/store";
import { clock } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

export function JobsView() {
  const jobs = useSpark((s) => s.jobs);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs tracking-[0.18em] text-subtle uppercase">Operations</p>
        <h1 className="text-2xl font-medium tracking-tight">Jobs</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Pulls, installs, and serves run on the twin with compressed time so you can watch the box change.
        </p>
      </header>
      {jobs.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
          No jobs yet. Stand up a playbook or ask the operator.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="text-xs text-subtle">{clock(j.startedAt)}</p>
                </div>
                <Badge
                  variant={
                    j.status === "ok" ? "live" : j.status === "running" ? "solid" : j.status === "error" ? "danger" : "default"
                  }
                >
                  {j.status}
                </Badge>
              </div>
              <Progress value={j.progress} className="mt-3" />
              <ol className="mt-3 flex flex-col gap-1">
                {j.steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        s.status === "ok"
                          ? "text-live"
                          : s.status === "running"
                            ? "text-primary"
                            : "text-subtle"
                      }
                    >
                      {s.status === "ok" ? "done" : s.status === "running" ? "run" : "wait"}
                    </span>
                    <span className="text-muted-foreground">{s.label}</span>
                  </li>
                ))}
              </ol>
              {j.logs.length > 0 ? (
                <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-background p-3 font-mono text-xs leading-5 text-muted-foreground">
                  {j.logs
                    .slice(-8)
                    .map((l) => `${clock(l.t)}  ${l.line}`)
                    .join("\n")}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
