import type { CatalogModel, ModelTag, RuntimeId } from "./types";

export const CATALOG: CatalogModel[] = [
  {
    id: "dolphin-70b",
    name: "Dolphin 3.0 70B",
    family: "Llama 3.1 · Cognitive Computations",
    paramsLabel: "70B",
    paramsB: 70,
    tags: ["unrestricted", "open"],
    quants: [
      { name: "Q4_K_M", sizeGb: 42, runtimes: ["ollama", "llamacpp"], tokPerSec: 38 },
      { name: "Q5_K_M", sizeGb: 50, runtimes: ["ollama", "llamacpp"], tokPerSec: 32 },
      { name: "Q8_0", sizeGb: 74, runtimes: ["llamacpp"], tokPerSec: 24 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "The default unrestricted desk model. No refusal training, strong general assistant, fits with generous KV on 128 GB.",
    ollama: "dolphin-llama3:70b",
    hf: "cognitivecomputations/Dolphin3.0-Llama3.1-70B",
  },
  {
    id: "dolphin-8b",
    name: "Dolphin 3.0 8B",
    family: "Llama 3.1 · Cognitive Computations",
    paramsLabel: "8B",
    paramsB: 8,
    tags: ["unrestricted", "fast"],
    quants: [
      { name: "Q8_0", sizeGb: 8.5, runtimes: ["ollama", "llamacpp"], tokPerSec: 92 },
      { name: "Q4_K_M", sizeGb: 5.2, runtimes: ["ollama", "llamacpp"], tokPerSec: 110 },
    ],
    defaultQuant: "Q8_0",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "Fast unrestricted sidecar. Keep it loaded next to a 70B for routing, tools, and snappy drafts.",
    ollama: "dolphin-llama3:8b",
    hf: "cognitivecomputations/Dolphin3.0-Llama3.1-8B",
  },
  {
    id: "llama33-ablit",
    name: "Llama 3.3 70B Abliterated",
    family: "Llama 3.3",
    paramsLabel: "70B",
    paramsB: 70,
    tags: ["unrestricted", "open"],
    quants: [
      { name: "Q4_K_M", sizeGb: 40, runtimes: ["ollama", "llamacpp"], tokPerSec: 40 },
      { name: "NVFP4", sizeGb: 38, runtimes: ["vllm", "trtllm"], tokPerSec: 58 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "Meta 3.3 instruct with refusal directions removed. Better writing than Dolphin; still fully local and uncensored.",
    ollama: "hf.co/mlabonne/Llama-3.3-70B-Instruct-abliterated:Q4_K_M",
    hf: "mlabonne/Llama-3.3-70B-Instruct-abliterated",
  },
  {
    id: "qwen25-ablit",
    name: "Qwen2.5 72B Abliterated",
    family: "Qwen2.5",
    paramsLabel: "72B",
    paramsB: 72,
    tags: ["unrestricted", "coding"],
    quants: [
      { name: "Q4_K_M", sizeGb: 43, runtimes: ["ollama", "llamacpp"], tokPerSec: 36 },
      { name: "Q5_K_M", sizeGb: 52, runtimes: ["llamacpp"], tokPerSec: 30 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "Unrestricted Qwen for bilingual work and code. Strong at structured output; pair with the 8B Dolphin as a router.",
    ollama: "hf.co/huihui-ai/Qwen2.5-72B-Instruct-abliterated:Q4_K_M",
    hf: "huihui-ai/Qwen2.5-72B-Instruct-abliterated",
  },
  {
    id: "hermes3-70b",
    name: "Hermes 3 70B",
    family: "Nous Research · Llama 3.1",
    paramsLabel: "70B",
    paramsB: 70,
    tags: ["open", "unrestricted"],
    quants: [
      { name: "Q5_K_M", sizeGb: 49, runtimes: ["ollama", "llamacpp"], tokPerSec: 31 },
      { name: "Q4_K_M", sizeGb: 41, runtimes: ["ollama", "llamacpp"], tokPerSec: 37 },
    ],
    defaultQuant: "Q5_K_M",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "Function-calling first. Light alignment, excellent tool use — the operator’s pick when the Spark is driving agents.",
    ollama: "hermes3:70b",
    hf: "NousResearch/Hermes-3-Llama-3.1-70B",
  },
  {
    id: "nemotron3-120b",
    name: "Nemotron 3 Super 120B",
    family: "NVIDIA",
    paramsLabel: "120B · 12.7B active",
    paramsB: 120,
    activeB: 12.7,
    tags: ["nvidia", "moe", "open"],
    quants: [
      { name: "Q4_K_M", sizeGb: 87, runtimes: ["ollama", "llamacpp"], tokPerSec: 28 },
      { name: "NVFP4", sizeGb: 72, runtimes: ["vllm", "trtllm"], tokPerSec: 44 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "ollama",
    contextK: 128,
    summary:
      "NVIDIA’s flagship on this box. MoE so 120B thinks and ~13B fires. Tight but proven at ~87 GB Q4 on a single Spark.",
    ollama: "nemotron-3-super",
    hf: "nvidia/Nemotron-3-Super-120B",
  },
  {
    id: "qwen36-35b-nvfp4",
    name: "Qwen3.6 35B NVFP4",
    family: "Qwen · NVIDIA checkpoint",
    paramsLabel: "35B-A3B",
    paramsB: 35,
    activeB: 3,
    tags: ["nvidia", "fast", "moe"],
    quants: [
      { name: "NVFP4", sizeGb: 20, runtimes: ["vllm", "trtllm"], tokPerSec: 84 },
      { name: "BF16", sizeGb: 70, runtimes: ["vllm"], tokPerSec: 32 },
    ],
    defaultQuant: "NVFP4",
    defaultRuntime: "vllm",
    contextK: 256,
    summary:
      "The speed play. NVIDIA’s NVFP4 checkpoint plus vLLM MTP is up to 2.6× faster on GB10. Leave headroom for a 70B beside it.",
    hf: "nvidia/Qwen3.6-35B-A3B-NVFP4",
  },
  {
    id: "qwen3-next-80b",
    name: "Qwen3 Next 80B",
    family: "Qwen3 MoE",
    paramsLabel: "80B-A3B",
    paramsB: 80,
    activeB: 3,
    tags: ["open", "moe", "fast"],
    quants: [
      { name: "Q4_K_M", sizeGb: 48, runtimes: ["llamacpp", "ollama"], tokPerSec: 45 },
      { name: "NVFP4", sizeGb: 44, runtimes: ["vllm"], tokPerSec: 62 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "llamacpp",
    contextK: 256,
    summary:
      "Community favorite on Spark: ~45 tok/s at Q4 with ~115 GB unified in use including long context.",
    ollama: "qwen3-next:80b",
    hf: "Qwen/Qwen3-Next-80B-A3B",
  },
  {
    id: "qwen3-coder-80b",
    name: "Qwen3 Coder Next 80B",
    family: "Qwen3 Coder",
    paramsLabel: "80B",
    paramsB: 80,
    tags: ["coding", "open"],
    quants: [
      { name: "Q8_0", sizeGb: 84, runtimes: ["llamacpp"], tokPerSec: 26 },
      { name: "Q4_K_M", sizeGb: 48, runtimes: ["llamacpp", "ollama"], tokPerSec: 41 },
    ],
    defaultQuant: "Q8_0",
    defaultRuntime: "llamacpp",
    contextK: 256,
    summary:
      "Repo-scale coder. Q8 on llama.cpp is the quality pick; drop to Q4 if you also want a chat model resident.",
    ollama: "qwen3-coder-next:80b",
    hf: "Qwen/Qwen3-Coder-Next-80B",
  },
  {
    id: "r1-distill-70b",
    name: "DeepSeek R1 Distill 70B",
    family: "DeepSeek · Llama 3.3",
    paramsLabel: "70B",
    paramsB: 70,
    tags: ["reasoning", "open"],
    quants: [
      { name: "Q4_K_M", sizeGb: 42, runtimes: ["ollama", "llamacpp"], tokPerSec: 34 },
      { name: "Q5_K_M", sizeGb: 51, runtimes: ["llamacpp"], tokPerSec: 28 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "ollama",
    contextK: 64,
    summary:
      "Reasoning distill that actually fits. Use for hard problems; not the uncensored pick.",
    ollama: "deepseek-r1:70b",
    hf: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
  },
  {
    id: "gemma4-26b-nvfp4",
    name: "Gemma 4 26B NVFP4",
    family: "Gemma · NVIDIA",
    paramsLabel: "26B-A4B",
    paramsB: 26,
    activeB: 4,
    tags: ["nvidia", "fast", "moe"],
    quants: [{ name: "NVFP4", sizeGb: 13, runtimes: ["vllm", "trtllm"], tokPerSec: 96 }],
    defaultQuant: "NVFP4",
    defaultRuntime: "vllm",
    contextK: 128,
    summary:
      "Tiny NVFP4 resident. Park it next to a 70B unrestricted model for cheap classification and routing.",
    hf: "nvidia/Gemma-4-26B-A4B-NVFP4",
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS 120B",
    family: "Open-weight",
    paramsLabel: "120B",
    paramsB: 120,
    tags: ["open"],
    quants: [
      { name: "F16", sizeGb: 96, runtimes: ["llamacpp"], tokPerSec: 18 },
      { name: "Q4_K_M", sizeGb: 68, runtimes: ["llamacpp", "ollama"], tokPerSec: 29 },
    ],
    defaultQuant: "Q4_K_M",
    defaultRuntime: "llamacpp",
    contextK: 32,
    summary:
      "llama.cpp darling on GB10. Use flash-attn, unified KV, and a 16k window — dense 120B is bandwidth-bound here.",
    hf: "openai/gpt-oss-120b",
  },
];

export const TAG_LABEL: Record<ModelTag, string> = {
  unrestricted: "Unrestricted",
  nvidia: "NVFP4",
  coding: "Coding",
  reasoning: "Reasoning",
  multimodal: "Multimodal",
  moe: "MoE",
  fast: "Fast",
  open: "Open weight",
};

export function modelById(id: string) {
  return CATALOG.find((m) => m.id === id);
}

export function quantOf(model: CatalogModel, name?: string) {
  return model.quants.find((q) => q.name === (name ?? model.defaultQuant)) ?? model.quants[0];
}

export function runtimeOk(model: CatalogModel, runtime: RuntimeId, quantName?: string) {
  const q = quantOf(model, quantName);
  return q.runtimes.includes(runtime);
}
