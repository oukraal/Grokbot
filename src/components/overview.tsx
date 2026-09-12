import { ArrowRight, Cpu, HardDrive, MemoryStick, Zap } from "lucide-react";
import { Chassis } from "./chassis";
import { GaugeGrid, TelemetryChart } from "./gauges";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SPARK } from "@/lib/spark/hardware";
import { useSpark } from "@/lib/spark/store";
import { runtimeById } from "@/lib/spark/runtimes";
import { fmtGb, fmtTok } from "@/lib/utils";

export function Overview() {
  const models = useSpark((s) => s.models);
  const jobs = useSpark((s) => s.jobs);
  const seeded = useSpark((s) => s.seeded);
  const runPlaybook = useSpark((s) => s.runPlaybook);
  const setView = useSpark((s) => s.setView);
  const setPlayground = useSpark((s) => s.setPlayground);
  const serving = models.filter((m) => m.status === "serving");
  const running = jobs.filter((j) => j.status === "running" || j.status === "queued");
  const empty = models.length === 0 && running.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs tracking-[0.18em] text-subtle uppercase">Device</p>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Desk Spark
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          GB10 twin · {SPARK.memoryGb} GB coherent memory · local models, no cloud policy.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Chassis />
        <div className="flex flex-col gap-3">
          <GaugeGrid />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Cpu} k="CPU" v="20-core Arm" />
            <Stat icon={MemoryStick} k="Bandwidth" v="273 GB/s" />
            <Stat icon={HardDrive} k="NVMe" v="4 TB" />
            <Stat icon={Zap} k="TDP" v="140 W" />
          </div>
        </div>
      </div>

      {empty && !seeded ? (
        <div className="rounded-xl bg-card p-5 shadow-[0_0_0_1px_rgba(236,234,228,0.08)] md:p-6">
          <p className="text-xs tracking-[0.16em] text-subtle uppercase">Factory image</p>
          <h2 className="mt-2 text-xl font-medium tracking-tight">No models loaded</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Stand up a sovereign stack: Ollama, Dolphin 8B as a fast sidecar, Dolphin 70B as the unrestricted desk model, OpenAI-compatible API.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => runPlaybook("sovereign")}>
              Stand up unrestricted stack
              <ArrowRight />
            </Button>
            <Button variant="secondary" onClick={() => setView("playbooks")}>
              Browse playbooks
            </Button>
          </div>
        </div>
      ) : null}

      {running.length > 0 ? (
        <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">In flight</p>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setView("jobs")}
            >
              Jobs
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {running.slice(0, 3).map((j) => (
              <li key={j.id} className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full bg-primary transition-[width] duration-300"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
                <span className="w-40 truncate text-xs text-muted-foreground">{j.title}</span>
                <span className="w-10 text-right font-mono text-xs tabular text-subtle">
                  {j.progress}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {serving.length > 0 ? (
        <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
          <p className="text-sm font-medium">Serving</p>
          <ul className="mt-3 flex flex-col gap-2">
            {serving.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-lg bg-elevated px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{m.name}</p>
                    <Badge variant="live">Live</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {runtimeById(m.runtime).name} · {m.quant} · {fmtGb(m.sizeGb)}
                    {m.tokPerSec ? ` · ${fmtTok(m.tokPerSec)}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPlayground(m.catalogId);
                    setView("models");
                  }}
                >
                  Talk
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {models.length > 0 ? (
        <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">On disk</p>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setView("models")}
            >
              Catalog
            </button>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {models.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm">{m.name}</p>
                  <p className="font-mono text-xs text-subtle">
                    {m.quant} · {fmtGb(m.sizeGb)} · {runtimeById(m.runtime).name}
                  </p>
                </div>
                <Badge variant={m.status === "serving" ? "live" : "default"}>
                  {m.status === "serving" ? "Serving" : "Ready"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TelemetryChart />
    </div>
  );
}

function Stat({
  icon: Icon,
  k,
  v,
}: {
  icon: typeof Cpu;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
      <Icon className="size-4 text-subtle" />
      <div>
        <p className="text-xs text-subtle">{k}</p>
        <p className="text-sm text-foreground">{v}</p>
      </div>
    </div>
  );
}
