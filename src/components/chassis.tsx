import { SPARK } from "@/lib/spark/hardware";
import { useSpark } from "@/lib/spark/store";
import { fmtGb } from "@/lib/utils";

export function Chassis() {
  const status = useSpark((s) => s.device.status);
  const mem = useSpark((s) => s.telemetry.memUsedGb);
  const serving = useSpark((s) => s.models.filter((m) => m.status === "serving").length);
  const busy = status === "busy";

  return (
    <div className="rounded-xl bg-chassis p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
      <div className="rounded-lg bg-elevated px-4 py-4 shadow-[inset_0_0_0_1px_rgba(236,234,228,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">
            DGX SPARK
          </p>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="live-dot" />
            {busy ? "Busy" : "Online"}
          </span>
        </div>
        <p className="mt-5 font-sans text-3xl font-medium tracking-tight text-foreground">
          GB10
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {SPARK.chip}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <Spec k="Unified" v={`${fmtGb(mem)} / 128`} />
          <Spec k="Serving" v={serving ? `${serving} model${serving > 1 ? "s" : ""}` : "Idle"} />
          <Spec k="CUDA" v={SPARK.cuda} />
          <Spec k="Storage" v="4 TB NVMe" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-xs tracking-wide text-subtle">
        <span>spark-01</span>
        <span>Grace Blackwell · coherent</span>
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-subtle">{k}</p>
      <p className="mt-0.5 font-mono text-sm tabular text-foreground">{v}</p>
    </div>
  );
}
