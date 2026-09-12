export type RuntimeId =
  | "ollama"
  | "vllm"
  | "llamacpp"
  | "trtllm"
  | "openwebui"
  | "litellm";

export type ModelTag =
  | "unrestricted"
  | "nvidia"
  | "coding"
  | "reasoning"
  | "multimodal"
  | "moe"
  | "fast"
  | "open";

export type Quant = {
  name: string;
  sizeGb: number;
  runtimes: RuntimeId[];
  tokPerSec: number;
};

export type CatalogModel = {
  id: string;
  name: string;
  family: string;
  paramsLabel: string;
  paramsB: number;
  activeB?: number;
  tags: ModelTag[];
  quants: Quant[];
  defaultQuant: string;
  defaultRuntime: RuntimeId;
  contextK: number;
  summary: string;
  ollama?: string;
  hf?: string;
  clusterNodes?: 1 | 2 | 4;
};

export type RuntimeDef = {
  id: RuntimeId;
  name: string;
  role: string;
  summary: string;
  endpoint: string;
  installMs: number;
};

export type JobKind = "playbook" | "install_runtime" | "pull_model" | "serve" | "stop";
export type JobStatus = "queued" | "running" | "ok" | "error";

export type JobStep = {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
  status: JobStatus;
  log?: string;
  effect?: JobEffect;
};

export type JobEffect =
  | { type: "runtime_ready"; runtime: RuntimeId; version: string }
  | { type: "runtime_running"; runtime: RuntimeId }
  | { type: "model_ready"; modelId: string; runtime: RuntimeId; quant: string; sizeGb: number }
  | { type: "model_serving"; modelId: string; runtime: RuntimeId; tokPerSec: number }
  | { type: "model_stop"; modelId: string }
  | { type: "model_unload"; modelId: string }
  | { type: "reset" };

export type Job = {
  id: string;
  title: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;
  steps: JobStep[];
  stepIndex: number;
  startedAt: number;
  finishedAt?: number;
  logs: { t: number; line: string }[];
};

export type InstalledModel = {
  id: string;
  catalogId: string;
  name: string;
  runtime: RuntimeId;
  quant: string;
  sizeGb: number;
  status: "ready" | "serving";
  endpoint?: string;
  tokPerSec?: number;
  loadedAt: number;
};

export type RuntimeState = {
  id: RuntimeId;
  status: "missing" | "installing" | "ready" | "running";
  version?: string;
};

export type TelemetrySample = {
  t: number;
  gpu: number;
  mem: number;
  power: number;
};

export type Telemetry = {
  gpuUtil: number;
  cpuUtil: number;
  memUsedGb: number;
  memTotalGb: number;
  storageUsedGb: number;
  storageTotalGb: number;
  tempC: number;
  powerW: number;
  netMbps: number;
  history: TelemetrySample[];
};

export type Device = {
  name: string;
  hostname: string;
  chip: string;
  os: string;
  cuda: string;
  status: "online" | "busy";
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
};

export type ViewId = "overview" | "models" | "runtimes" | "jobs" | "playbooks";

export type PlaybookId =
  | "sovereign"
  | "max-120b"
  | "nvfp4-fast"
  | "coder"
  | "dual"
  | "reset";

export type SparkState = {
  device: Device;
  telemetry: Telemetry;
  runtimes: RuntimeState[];
  models: InstalledModel[];
  jobs: Job[];
  chat: ChatMessage[];
  view: ViewId;
  agentOpen: boolean;
  playgroundModelId: string | null;
  seeded: boolean;
};
