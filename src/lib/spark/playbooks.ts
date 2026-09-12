import { uid } from "../utils";
import { modelById, quantOf } from "./catalog";
import { runtimeById } from "./runtimes";
import type { Job, JobEffect, JobStep, PlaybookId, RuntimeId } from "./types";

type StepSpec = Omit<JobStep, "id" | "status">;

function steps(specs: StepSpec[]): JobStep[] {
  return specs.map((s) => ({ ...s, id: uid("st"), status: "queued" as const }));
}

function job(title: string, kind: Job["kind"], specs: StepSpec[]): Job {
  const now = Date.now();
  return {
    id: uid("job"),
    title,
    kind,
    status: "queued",
    progress: 0,
    steps: steps(specs),
    stepIndex: 0,
    startedAt: now,
    logs: [{ t: now, line: `queued · ${title}` }],
  };
}

export function installRuntimeJob(runtime: RuntimeId): Job {
  const r = runtimeById(runtime);
  return job(`Install ${r.name}`, "install_runtime", [
    {
      label: "Read DGX OS image",
      detail: "CUDA 13.0 · NVIDIA Container Runtime already present",
      durationMs: 700,
      log: "dgx-os 7 · ubuntu 24.04 · cuda 13.0 ok",
    },
    {
      label: `Pull ${r.name}`,
      detail: r.summary,
      durationMs: r.installMs,
      log: `install ${r.id} on gb10`,
    },
    {
      label: "Register service",
      detail: `Bind ${r.endpoint}`,
      durationMs: 600,
      log: `${r.id} listening ${r.endpoint}`,
      effect: { type: "runtime_ready", runtime, version: "gb10" },
    },
  ]);
}

export function pullModelJob(
  catalogId: string,
  runtime: RuntimeId,
  quantName?: string,
): Job | null {
  const model = modelById(catalogId);
  if (!model) return null;
  const quant = quantOf(model, quantName);
  const size = quant.sizeGb;
  return job(`Pull ${model.name} · ${quant.name}`, "pull_model", [
    {
      label: "Resolve artifact",
      detail: model.hf ?? model.ollama ?? catalogId,
      durationMs: 800,
      log: `resolve ${model.name} ${quant.name} via ${runtime}`,
    },
    {
      label: "Stream weights",
      detail: `${size.toFixed(1)} GB into 4 TB NVMe`,
      durationMs: Math.round(3800 + size * 55),
      log: `nvme write ${size.toFixed(1)} GB`,
    },
    {
      label: "Verify checksum",
      detail: quant.name,
      durationMs: 700,
      log: `${quant.name} verified`,
    },
    {
      label: "Register with runtime",
      detail: runtimeById(runtime).name,
      durationMs: 500,
      log: `${catalogId} ready on ${runtime}`,
      effect: {
        type: "model_ready",
        modelId: catalogId,
        runtime,
        quant: quant.name,
        sizeGb: size,
      },
    },
  ]);
}

export function serveModelJob(catalogId: string, runtime: RuntimeId, tokPerSec: number): Job {
  const model = modelById(catalogId);
  const name = model?.name ?? catalogId;
  return job(`Serve ${name}`, "serve", [
    {
      label: "Allocate unified memory",
      detail: "CPU and GPU share one 128 GB pool",
      durationMs: 900,
      log: "cuda malloc managed · coherent",
    },
    {
      label: "Load weights",
      detail: runtimeById(runtime).name,
      durationMs: 1600,
      log: `load ${catalogId} on ${runtime}`,
    },
    {
      label: "Bind OpenAI endpoint",
      detail: runtimeById(runtime).endpoint,
      durationMs: 500,
      log: `${runtimeById(runtime).endpoint}/models ${catalogId}`,
      effect: { type: "model_serving", modelId: catalogId, runtime, tokPerSec },
    },
  ]);
}

export function stopModelJob(catalogId: string): Job {
  const model = modelById(catalogId);
  return job(`Stop ${model?.name ?? catalogId}`, "stop", [
    {
      label: "Drain in-flight",
      detail: "Finish active completions",
      durationMs: 600,
      log: `drain ${catalogId}`,
    },
    {
      label: "Release KV",
      detail: "Unified memory returned to the pool",
      durationMs: 500,
      log: `unload ${catalogId}`,
      effect: { type: "model_stop", modelId: catalogId },
    },
  ]);
}

const PLAYBOOK_META: Record<
  PlaybookId,
  { title: string; blurb: string; minutes: string }
> = {
  sovereign: {
    title: "Sovereign unrestricted stack",
    blurb: "Ollama + Dolphin 8B sidecar + Dolphin 70B as the desk model. Local, uncensored, OpenAI-compatible.",
    minutes: "~20 s on the twin",
  },
  "max-120b": {
    title: "Max capability 120B",
    blurb: "Nemotron 3 Super 120B at Q4. The largest comfortable single-Spark model.",
    minutes: "~24 s on the twin",
  },
  "nvfp4-fast": {
    title: "NVFP4 sprinter",
    blurb: "vLLM + Qwen3.6 35B NVFP4. Highest tokens/sec on GB10 with NVIDIA’s checkpoint.",
    minutes: "~18 s on the twin",
  },
  coder: {
    title: "Coder desk",
    blurb: "llama.cpp + Qwen3 Coder Next 80B Q8. Repo-scale local coding, no cloud.",
    minutes: "~22 s on the twin",
  },
  dual: {
    title: "Dual unrestricted + speed",
    blurb: "Dolphin 70B on Ollama and Qwen3.6 35B NVFP4 on vLLM, glued with LiteLLM.",
    minutes: "~28 s on the twin",
  },
  reset: {
    title: "Factory the twin",
    blurb: "Unload models, stop runtimes, return to a blank DGX OS image.",
    minutes: "instant",
  },
};

export function playbookMeta(id: PlaybookId) {
  return PLAYBOOK_META[id];
}

export const PLAYBOOK_IDS: PlaybookId[] = [
  "sovereign",
  "max-120b",
  "nvfp4-fast",
  "coder",
  "dual",
  "reset",
];

export function playbookJobs(id: PlaybookId | string): Job[] {
  switch (id) {
    case "sovereign":
      return [
        installRuntimeJob("ollama"),
        pullModelJob("dolphin-8b", "ollama")!,
        pullModelJob("dolphin-70b", "ollama")!,
        serveModelJob("dolphin-70b", "ollama", 38),
      ];
    case "max-120b":
      return [
        installRuntimeJob("ollama"),
        pullModelJob("nemotron3-120b", "ollama")!,
        serveModelJob("nemotron3-120b", "ollama", 28),
      ];
    case "nvfp4-fast":
      return [
        installRuntimeJob("vllm"),
        pullModelJob("qwen36-35b-nvfp4", "vllm", "NVFP4")!,
        serveModelJob("qwen36-35b-nvfp4", "vllm", 84),
      ];
    case "coder":
      return [
        installRuntimeJob("llamacpp"),
        pullModelJob("qwen3-coder-80b", "llamacpp", "Q8_0")!,
        serveModelJob("qwen3-coder-80b", "llamacpp", 26),
      ];
    case "dual":
      return [
        installRuntimeJob("ollama"),
        installRuntimeJob("vllm"),
        installRuntimeJob("litellm"),
        pullModelJob("dolphin-70b", "ollama")!,
        pullModelJob("qwen36-35b-nvfp4", "vllm", "NVFP4")!,
        serveModelJob("dolphin-70b", "ollama", 38),
        serveModelJob("qwen36-35b-nvfp4", "vllm", 84),
      ];
    case "reset":
      return [
        job("Factory reset", "playbook", [
          {
            label: "Stop endpoints",
            detail: "Drain and unbind",
            durationMs: 500,
            log: "stop all serving",
          },
          {
            label: "Unload weights",
            detail: "Return unified memory",
            durationMs: 700,
            log: "free 128 GB pool",
          },
          {
            label: "Restore DGX OS image",
            detail: "Runtimes removed, catalog untouched",
            durationMs: 600,
            log: "twin at factory",
            effect: { type: "reset" },
          },
        ]),
      ];
    default:
      return [];
  }
}

export function describeEffect(effect: JobEffect): string {
  switch (effect.type) {
    case "runtime_ready":
      return `${effect.runtime} ready`;
    case "runtime_running":
      return `${effect.runtime} running`;
    case "model_ready":
      return `${effect.modelId} ${effect.quant} on disk`;
    case "model_serving":
      return `${effect.modelId} serving`;
    case "model_stop":
      return `${effect.modelId} stopped`;
    case "model_unload":
      return `${effect.modelId} unloaded`;
    case "reset":
      return "factory";
  }
}
