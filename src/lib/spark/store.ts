import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "../utils";
import {
  compactSnapshot,
  enqueueJobs,
  freshState,
  tickState,
} from "./engine";
import {
  installRuntimeJob,
  playbookJobs,
  pullModelJob,
  serveModelJob,
  stopModelJob,
} from "./playbooks";
import { modelById, quantOf } from "./catalog";
import type { ChatMessage, PlaybookId, RuntimeId, SparkState, ViewId } from "./types";

type SparkActions = {
  tick: (now: number) => void;
  setView: (view: ViewId) => void;
  setAgentOpen: (open: boolean) => void;
  setPlayground: (id: string | null) => void;
  runPlaybook: (id: PlaybookId) => void;
  installRuntime: (id: RuntimeId) => void;
  pullModel: (catalogId: string, runtime?: RuntimeId, quant?: string) => void;
  serveModel: (catalogId: string) => void;
  stopModel: (catalogId: string) => void;
  pushChat: (msg: Omit<ChatMessage, "id" | "at"> & { id?: string }) => void;
  applyAgentJobs: (kind: string, args: Record<string, string>) => string;
  resetTwin: () => void;
  snapshot: () => ReturnType<typeof compactSnapshot>;
};

let lastTick = Date.now();

export const useSpark = create<SparkState & SparkActions>()(
  persist(
    (set, get) => ({
      ...freshState(),
      tick: (now) => {
        const dt = Math.min(800, Math.max(80, now - lastTick));
        lastTick = now;
        set(tickState(get(), now, dt));
      },
      setView: (view) => set({ view }),
      setAgentOpen: (agentOpen) => set({ agentOpen }),
      setPlayground: (playgroundModelId) => set({ playgroundModelId }),
      runPlaybook: (id) => {
        const jobs = playbookJobs(id);
        if (!jobs.length) return;
        set(enqueueJobs(get(), jobs));
      },
      installRuntime: (id) => {
        const cur = get().runtimes.find((r) => r.id === id);
        if (cur && cur.status !== "missing") return;
        set(enqueueJobs(get(), [installRuntimeJob(id)]));
      },
      pullModel: (catalogId, runtime, quant) => {
        const model = modelById(catalogId);
        if (!model) return;
        const rt = runtime ?? model.defaultRuntime;
        const q = quant ?? model.defaultQuant;
        const jobs = [];
        const rs = get().runtimes.find((r) => r.id === rt)?.status;
        if (rs === "missing" || !rs) jobs.push(installRuntimeJob(rt));
        const pull = pullModelJob(catalogId, rt, q);
        if (pull) jobs.push(pull);
        set(enqueueJobs(get(), jobs));
      },
      serveModel: (catalogId) => {
        const installed = get().models.find((m) => m.catalogId === catalogId);
        const model = modelById(catalogId);
        if (!model && !installed) return;
        const rt = installed?.runtime ?? model!.defaultRuntime;
        const q = quantOf(model ?? modelById(installed!.catalogId)!, installed?.quant);
        const jobs = [];
        const rs = get().runtimes.find((r) => r.id === rt)?.status;
        if (rs === "missing" || !rs) jobs.push(installRuntimeJob(rt));
        if (!installed) {
          const pull = pullModelJob(catalogId, rt, q.name);
          if (pull) jobs.push(pull);
        }
        jobs.push(serveModelJob(catalogId, rt, q.tokPerSec));
        set(enqueueJobs(get(), jobs));
      },
      stopModel: (catalogId) => set(enqueueJobs(get(), [stopModelJob(catalogId)])),
      pushChat: (msg) =>
        set({
          chat: [
            ...get().chat,
            { id: msg.id ?? uid("msg"), role: msg.role, text: msg.text, at: Date.now() },
          ].slice(-48),
        }),
      applyAgentJobs: (kind, args) => {
        const s = get();
        if (kind === "run_playbook") {
          const id = args.id as PlaybookId;
          if (!id) return "missing playbook id";
          s.runPlaybook(id);
          return `queued playbook ${id}`;
        }
        if (kind === "install_runtime") {
          s.installRuntime(args.id as RuntimeId);
          return `queued install ${args.id}`;
        }
        if (kind === "pull_model") {
          s.pullModel(args.modelId, args.runtime as RuntimeId | undefined, args.quant);
          return `queued pull ${args.modelId}`;
        }
        if (kind === "serve_model") {
          s.serveModel(args.modelId);
          return `queued serve ${args.modelId}`;
        }
        if (kind === "stop_model") {
          s.stopModel(args.modelId);
          return `queued stop ${args.modelId}`;
        }
        if (kind === "reset_twin") {
          s.resetTwin();
          return "twin reset";
        }
        return `unknown action ${kind}`;
      },
      resetTwin: () => {
        const { chat, view, agentOpen } = get();
        set({ ...freshState(), chat, view, agentOpen, seeded: true });
      },
      snapshot: () => compactSnapshot(get()),
    }),
    {
      name: "sparkforge-v1",
      partialize: (s) => ({
        device: s.device,
        runtimes: s.runtimes,
        models: s.models,
        jobs: s.jobs.slice(0, 16),
        chat: s.chat.slice(-24),
        view: s.view,
        agentOpen: s.agentOpen,
        playgroundModelId: s.playgroundModelId,
        seeded: s.seeded,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SparkState>;
        return {
          ...current,
          ...p,
          telemetry: current.telemetry,
        };
      },
    },
  ),
);
