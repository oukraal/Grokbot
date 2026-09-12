import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useSpark } from "@/lib/spark/store";
import { fmtGb, fmtPct, fmtTemp, fmtWatts } from "@/lib/utils";

export function GaugeGrid() {
  const t = useSpark((s) => s.telemetry);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Gauge
        label="GPU"
        value={fmtPct(t.gpuUtil)}
        fill={t.gpuUtil}
        hint="Blackwell util"
      />
      <Gauge
        label="Memory"
        value={`${fmtGb(t.memUsedGb)}`}
        fill={(t.memUsedGb / t.memTotalGb) * 100}
        hint={`${fmtGb(t.memTotalGb)} unified`}
      />
      <Gauge
        label="Power"
        value={fmtWatts(t.powerW)}
        fill={(t.powerW / 165) * 100}
        hint="SoC at the wall"
      />
      <Gauge
        label="Temp"
        value={fmtTemp(t.tempC)}
        fill={((t.tempC - 30) / 50) * 100}
        hint="GB10 package"
      />
    </div>
  );
}

function Gauge({
  label,
  value,
  fill,
  hint,
}: {
  label: string;
  value: string;
  fill: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
      <p className="text-xs tracking-wide text-subtle">{label}</p>
      <p className="mt-2 font-mono text-2xl tabular tracking-tight text-foreground">{value}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-input">
        <div
          className="h-full rounded-full bg-primary/80 transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(4, Math.min(100, fill))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function TelemetryChart() {
  const history = useSpark((s) => s.telemetry.history);
  const data = history.map((h) => ({ gpu: h.gpu, mem: (h.mem / 128) * 100 }));
  return (
    <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-foreground">Load</p>
        <p className="text-xs text-subtle">GPU · memory, last minute</p>
      </div>
      <div className="mt-3 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gpuFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c5ccc4" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#c5ccc4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="gpu"
              stroke="#c5ccc4"
              strokeWidth={1.4}
              fill="url(#gpuFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="mem"
              stroke="#7d9a78"
              strokeWidth={1.2}
              fill="none"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
