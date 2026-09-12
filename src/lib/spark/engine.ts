import { modelById } from "./catalog";
import { runtimeById } from "./runtimes";
import { SPARK } from "./hardware";
import type {
  InstalledModel,
  Job,
  JobEffect,
  RuntimeId,
  RuntimeState,
  SparkState,
  Telemetry,
} from "./types";

const OS_GB = SPARK.osReservedGb;
const MEM_TOTAL = SPARK.memoryGb;
const STORAGE_TOTAL = SPARK.storageTb * 1024;
const HISTORY = 48;

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function noise(n: number, amp: number) {
  return n + (Math.random() - 0.5) * amp;
}

export function freshRuntimes(): RuntimeState[] {
  return [
    { id: "ollama", status: "missing" },
    { id: "vllm", status: "missing" },
    { id: "llamacpp", status: "missing" },
    { id: "trtllm", status: "missing" },
    { id: "openwebui", status: "missing" },
    { id: "litellm", status: "missing" },
  ];
}

export function freshTelemetry(now: number, models: InstalledModel[]): Telemetry {
  const mem = OS_GB + models.reduce((s, m) => s + m.sizeGb, 0);
  return {
    gpuUtil: 4,
    cpuUtil: 6,
    memUsedGb: mem,
    memTotalGb: MEM_TOTAL,
    storageUsedGb: 128 + models.reduce((s, m) => s + m.sizeGb, 0),
    storageTotalGb: STORAGE_TOTAL,
    tempC: 41,
    powerW: 48,
    netMbps: 2,
    history: Array.from({ length: 12 }, (_, i) => ({
      t: now - (12 - i) * 400,
      gpu: 4,
      mem,
      power: 48,
    })),
  };
}

export function freshState(): SparkState {
  const now = Date.now();
  return {
    device: {
      name: "Desk Spark",
      hostname: "spark-01",
      chip: SPARK.chip,
      os: SPARK.os,
      cuda: SPARK.cuda,
      status: "online",
    },
    telemetry: freshTelemetry(now, []),
    runtimes: freshRuntimes(),
    models: [],
    jobs: [],
    chat: [
      {
        id: "hello",
        role: "assistant",
        text: "Spark is factory-fresh. 128 GB unified, CUDA 13, no models loaded. I can stand up an unrestricted local stack on this GB10 — Ollama plus Dolphin 70B — or we pick something tighter. What do you want on the box?",
        at: now,
      },
    ],
    view: "overview",
    agentOpen: true,
    playgroundModelId: null,
    seeded: false,
  };
}

export function applyEffect(state: SparkState, effect: JobEffect, now: number): SparkState {
  switch (effect.type) {
    case "runtime_ready":
      return {
        ...state,
        runtimes: state.runtimes.map((r) =>
          r.id === effect.runtime
            ? { ...r, status: r.status === "running" ? "running" : "ready", version: effect.version }
            : r,
        ),
      };
    case "runtime_running":
      return {
        ...state,
        runtimes: state.runtimes.map((r) =>
          r.id === effect.runtime ? { ...r, status: "running" } : r,
        ),
      };
    case "model_ready": {
      if (state.models.some((m) => m.catalogId === effect.modelId && m.runtime === effect.runtime)) {
        return state;
      }
      const cat = modelById(effect.modelId);
      const installed: InstalledModel = {
        id: `${effect.modelId}-${effect.runtime}`,
        catalogId: effect.modelId,
        name: cat?.name ?? effect.modelId,
        runtime: effect.runtime,
        quant: effect.quant,
        sizeGb: effect.sizeGb,
        status: "ready",
        loadedAt: now,
      };
      return { ...state, models: [...state.models, installed] };
    }
    case "model_serving": {
      const ep = runtimeById(effect.runtime).endpoint;
      const models = state.models.map((m) =>
        m.catalogId === effect.modelId
          ? {
              ...m,
              status: "serving" as const,
              runtime: effect.runtime,
              endpoint: ep,
              tokPerSec: effect.tokPerSec,
            }
          : m,
      );
      let next = models;
      if (!models.some((m) => m.catalogId === effect.modelId)) {
        const cat = modelById(effect.modelId);
        next = [
          ...models,
          {
            id: `${effect.modelId}-${effect.runtime}`,
            catalogId: effect.modelId,
            name: cat?.name ?? effect.modelId,
            runtime: effect.runtime,
            quant: cat?.defaultQuant ?? "Q4_K_M",
            sizeGb: cat?.quants[0]?.sizeGb ?? 40,
            status: "serving",
            endpoint: ep,
            tokPerSec: effect.tokPerSec,
            loadedAt: now,
          },
        ];
      }
      return {
        ...state,
        models: next,
        runtimes: state.runtimes.map((r) =>
          r.id === effect.runtime ? { ...r, status: "running", version: r.version ?? "gb10" } : r,
        ),
        playgroundModelId: state.playgroundModelId ?? effect.modelId,
        device: { ...state.device, status: "busy" },
      };
    }
    case "model_stop": {
      const models = state.models.map((m) =>
        m.catalogId === effect.modelId
          ? { ...m, status: "ready" as const, endpoint: undefined, tokPerSec: undefined }
          : m,
      );
      const stillServing = models.some((m) => m.status === "serving");
      return {
        ...state,
        models,
        device: { ...state.device, status: stillServing ? "busy" : "online" },
        playgroundModelId:
          state.playgroundModelId === effect.modelId
            ? (models.find((m) => m.status === "serving")?.catalogId ?? null)
            : state.playgroundModelId,
      };
    }
    case "model_unload":
      return {
        ...state,
        models: state.models.filter((m) => m.catalogId !== effect.modelId),
      };
    case "reset": {
      const blank = freshState();
      return {
        ...blank,
        chat: state.chat,
        view: state.view,
        agentOpen: state.agentOpen,
        seeded: true,
      };
    }
  }
}

function advanceJob(job: Job, dt: number, now: number): { job: Job; effects: JobEffect[] } {
  if (job.status === "ok" || job.status === "error") return { job, effects: [] };
  const effects: JobEffect[] = [];
  let remaining = dt;
  let steps = job.steps.map((s) => ({ ...s }));
  let index = job.stepIndex;
  let status: Job["status"] = "running";
  const logs = [...job.logs];

  if (job.status === "queued") {
    logs.push({ t: now, line: `start · ${job.title}` });
  }

  while (remaining > 0 && index < steps.length) {
    const step = steps[index];
    if (step.status === "queued") {
      steps[index] = { ...step, status: "running" };
      logs.push({ t: now, line: `${step.label.toLowerCase()} · ${step.detail}` });
    }
    const current = steps[index];
    const left = current.durationMs;
    if (remaining >= left) {
      remaining -= left;
      const done = { ...current, status: "ok" as const, durationMs: 0 };
      steps[index] = done;
      if (current.log) logs.push({ t: now, line: current.log });
      if (current.effect) effects.push(current.effect);
      index += 1;
    } else {
      steps[index] = { ...current, durationMs: left - remaining, status: "running" };
      remaining = 0;
    }
  }

  const total = job.steps.reduce((s, st) => s + (st.durationMs > 0 || st.status !== "ok" ? 1 : 1), 0);
  const doneCount = steps.filter((s) => s.status === "ok").length;
  const progress = Math.round((doneCount / Math.max(1, steps.length)) * 100);
  let finishedAt = job.finishedAt;
  if (index >= steps.length) {
    status = "ok";
    finishedAt = now;
    logs.push({ t: now, line: `ok · ${job.title}` });
  }

  void total;
  return {
    job: {
      ...job,
      status,
      steps,
      stepIndex: Math.min(index, steps.length - 1),
      progress: status === "ok" ? 100 : progress,
      finishedAt,
      logs: logs.slice(-80),
    },
    effects,
  };
}

export function enqueueJobs(state: SparkState, jobs: Job[]): SparkState {
  const stamped = jobs.map((j) => ({
    ...j,
    status: "queued" as Job["status"],
  }));
  return { ...state, jobs: [...stamped, ...state.jobs].slice(0, 40), seeded: true };
}

export function tickState(state: SparkState, now: number, dt: number): SparkState {
  let next: SparkState = { ...state };
  const active =
    next.jobs.find((j) => j.status === "running") ??
    next.jobs.find((j) => j.status === "queued");
  if (active) {
    const { job, effects } = advanceJob(active, dt, now);
    next = {
      ...next,
      jobs: next.jobs.map((j) => (j.id === job.id ? job : j)),
    };
    for (const effect of effects) {
      next = applyEffect(next, effect, now);
    }
    if (job.status === "ok") {
      const queued = next.jobs.find((j) => j.status === "queued");
      if (queued) {
        next = {
          ...next,
          jobs: next.jobs.map((j) =>
            j.id === queued.id ? { ...j, status: "running", startedAt: now } : j,
          ),
        };
      }
    }
  }

  next = {
    ...next,
    telemetry: tickTelemetry(next, now, dt),
    device: {
      ...next.device,
      status: next.models.some((m) => m.status === "serving") ||
      next.jobs.some((j) => j.status === "running")
        ? "busy"
        : "online",
    },
  };
  return next;
}

function tickTelemetry(state: SparkState, now: number, dt: number): Telemetry {
  const serving = state.models.filter((m) => m.status === "serving");
  const pulling = state.jobs.some(
    (j) => j.status === "running" && (j.kind === "pull_model" || j.kind === "install_runtime"),
  );
  const jobRunning = state.jobs.some((j) => j.status === "running");
  const memTarget =
    OS_GB +
    serving.reduce((s, m) => s + m.sizeGb + Math.min(12, m.sizeGb * 0.12), 0);
  const gpuTarget = serving.length
    ? 72 + serving.length * 8
    : pulling
      ? 14
      : jobRunning
        ? 9
        : 3.5;
  const powerTarget = serving.length ? 118 + serving.length * 10 : pulling ? 62 : 46;
  const tempTarget = serving.length ? 64 : pulling ? 48 : 40.5;
  const cpuTarget = pulling ? 38 : serving.length ? 22 : 7;
  const netTarget = pulling ? 420 : serving.length ? 8 : 1.4;
  const t = clamp(dt / 900, 0.04, 0.25);
  const prev = state.telemetry;
  const gpu = clamp(noise(lerp(prev.gpuUtil, gpuTarget, t), serving.length ? 3.2 : 0.8), 1, 99);
  const mem = clamp(lerp(prev.memUsedGb, memTarget, t), OS_GB, MEM_TOTAL - 0.4);
  const power = clamp(noise(lerp(prev.powerW, powerTarget, t), 2.4), 32, 165);
  const sample = { t: now, gpu, mem, power };
  const history = [...prev.history, sample].slice(-HISTORY);
  const storageBase = 128 + state.models.reduce((s, m) => s + m.sizeGb, 0);
  const pullingJob = state.jobs.find(
    (j) => j.status === "running" && j.kind === "pull_model",
  );
  const storageExtra = pullingJob ? (pullingJob.progress / 100) * 20 : 0;
  return {
    gpuUtil: gpu,
    cpuUtil: clamp(noise(lerp(prev.cpuUtil, cpuTarget, t), 1.6), 2, 96),
    memUsedGb: mem,
    memTotalGb: MEM_TOTAL,
    storageUsedGb: storageBase + storageExtra,
    storageTotalGb: STORAGE_TOTAL,
    tempC: clamp(noise(lerp(prev.tempC, tempTarget, t), 0.25), 34, 82),
    powerW: power,
    netMbps: clamp(noise(lerp(prev.netMbps, netTarget, t), pulling ? 18 : 0.4), 0.2, 900),
    history,
  };
}

export function compactSnapshot(state: SparkState) {
  return {
    chip: state.device.chip,
    os: state.device.os,
    cuda: state.device.cuda,
    status: state.device.status,
    memoryUsedGb: Number(state.telemetry.memUsedGb.toFixed(1)),
    memoryTotalGb: state.telemetry.memTotalGb,
    gpuUtil: Math.round(state.telemetry.gpuUtil),
    storageUsedGb: Math.round(state.telemetry.storageUsedGb),
    runtimes: state.runtimes.map((r) => ({ id: r.id, status: r.status })),
    models: state.models.map((m) => ({
      id: m.catalogId,
      name: m.name,
      runtime: m.runtime,
      quant: m.quant,
      sizeGb: m.sizeGb,
      status: m.status,
    })),
    jobs: state.jobs
      .filter((j) => j.status === "running" || j.status === "queued")
      .map((j) => ({ id: j.id, title: j.title, status: j.status, progress: j.progress })),
  };
}

export function runtimeStatus(state: SparkState, id: RuntimeId) {
  return state.runtimes.find((r) => r.id === id)?.status ?? "missing";
}
