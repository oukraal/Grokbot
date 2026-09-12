import { useMemo, useState } from "react";
import { CATALOG, TAG_LABEL, quantOf } from "@/lib/spark/catalog";
import { fitLabel } from "@/lib/spark/hardware";
import { runtimeById } from "@/lib/spark/runtimes";
import { useSpark } from "@/lib/spark/store";
import type { ModelTag } from "@/lib/spark/types";
import { fmtGb, fmtTok } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Playground } from "./playground";

const FILTERS: { id: "all" | ModelTag; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unrestricted", label: "Unrestricted" },
  { id: "nvidia", label: "NVFP4" },
  { id: "coding", label: "Coding" },
  { id: "reasoning", label: "Reasoning" },
  { id: "fast", label: "Fast" },
];

export function ModelsView() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("unrestricted");
  const models = useSpark((s) => s.models);
  const pullModel = useSpark((s) => s.pullModel);
  const serveModel = useSpark((s) => s.serveModel);
  const stopModel = useSpark((s) => s.stopModel);
  const playground = useSpark((s) => s.playgroundModelId);
  const setPlayground = useSpark((s) => s.setPlayground);

  const list = useMemo(
    () => (filter === "all" ? CATALOG : CATALOG.filter((m) => m.tags.includes(filter))),
    [filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs tracking-[0.18em] text-subtle uppercase">Weights</p>
        <h1 className="text-2xl font-medium tracking-tight">Models</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Sized for 128 GB unified memory. Unrestricted means local and, where tagged, without refusal training.
        </p>
      </header>

      {models.length > 0 ? (
        <section className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
          <p className="text-sm font-medium">Installed</p>
          <ul className="mt-3 flex flex-col gap-2">
            {models.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 rounded-lg bg-elevated p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {runtimeById(m.runtime).name} · {m.quant} · {fmtGb(m.sizeGb)}
                    {m.tokPerSec ? ` · ${fmtTok(m.tokPerSec)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status === "serving" ? (
                    <>
                      <Button size="sm" onClick={() => setPlayground(m.catalogId)}>
                        Talk
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => stopModel(m.catalogId)}>
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => serveModel(m.catalogId)}>
                      Serve
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {playground ? <Playground /> : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={
              f.id === filter
                ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                : "h-11 shrink-0 rounded-full bg-secondary px-4 text-sm text-muted-foreground shadow-[0_0_0_1px_rgba(236,234,228,0.08)]"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((m) => {
          const q = quantOf(m);
          const fit = fitLabel(q.sizeGb);
          const installed = models.find((x) => x.catalogId === m.id);
          return (
            <li
              key={m.id}
              className="flex flex-col rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-subtle">{m.family}</p>
                </div>
                <p className="font-mono text-xs tabular text-muted-foreground">{m.paramsLabel}</p>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{m.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <Badge key={t} variant={t === "unrestricted" ? "solid" : "default"}>
                    {TAG_LABEL[t]}
                  </Badge>
                ))}
                <Badge variant={fit.id === "easy" ? "live" : fit.id === "cluster" ? "danger" : "warn"}>
                  {fit.label}
                </Badge>
              </div>
              <p className="mt-3 font-mono text-xs text-subtle">
                {q.name} · {fmtGb(q.sizeGb)} · ~{fmtTok(q.tokPerSec)} · {runtimeById(m.defaultRuntime).name}
              </p>
              <div className="mt-4 flex gap-2">
                {installed?.status === "serving" ? (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setPlayground(m.id)}
                  >
                    Talk
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => serveModel(m.id)}>
                    {installed ? "Serve" : "Deploy"}
                  </Button>
                )}
                {!installed ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => pullModel(m.id)}
                  >
                    Pull
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
