import type { RuntimeDef, RuntimeId } from "./types";

export const RUNTIMES: RuntimeDef[] = [
  {
    id: "ollama",
    name: "Ollama",
    role: "Everyday runtime",
    summary:
      "One-command install on DGX OS. GGUF models, OpenAI-compatible API, the right first move on a Spark.",
    endpoint: "spark:11434/v1",
    installMs: 4200,
  },
  {
    id: "vllm",
    name: "vLLM",
    role: "Throughput",
    summary:
      "Use the GB10 image (spark-vllm-docker / FlashInfer). NVFP4 + MTP is how 35B hits 2.6× on this chip.",
    endpoint: "spark:8000/v1",
    installMs: 7800,
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    role: "Control",
    summary:
      "ghcr.io/spark-arena/dgx-llama-cpp. Best for Q8 quality, unified KV, and models vLLM does not love yet.",
    endpoint: "spark:8085/v1",
    installMs: 5400,
  },
  {
    id: "trtllm",
    name: "TensorRT-LLM",
    role: "NVIDIA path",
    summary:
      "nvcr.io tensorrt-llm spark-single-gpu image. Highest efficiency on NVFP4 checkpoints; longer first compile.",
    endpoint: "spark:8355/v1",
    installMs: 9600,
  },
  {
    id: "openwebui",
    name: "Open WebUI",
    role: "Chat surface",
    summary: "Sits in front of Ollama or any OpenAI-compatible endpoint. Optional; Sparkforge already talks to served models.",
    endpoint: "spark:3000",
    installMs: 3600,
  },
  {
    id: "litellm",
    name: "LiteLLM",
    role: "Router",
    summary:
      "Route a 70B unrestricted model, a 35B NVFP4 sprinter, and a coder through one key. Dual-stack glue.",
    endpoint: "spark:4000/v1",
    installMs: 3200,
  },
];

export function runtimeById(id: RuntimeId) {
  return RUNTIMES.find((r) => r.id === id)!;
}
