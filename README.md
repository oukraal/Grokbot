# Sparkforge

Operator console for an [NVIDIA DGX Spark](https://www.nvidia.com/en-us/products/workstations/dgx-spark/) (GB10). It plans unrestricted local models against 128 GB unified memory, installs runtimes (Ollama, vLLM, llama.cpp, TensorRT-LLM), and talks you through the stack.

This repo is the Sparkforge web app. On a Spark it runs as a local console in the browser.

## Run on a DGX Spark

DGX OS already has CUDA 13 and the NVIDIA container runtime. You need Node 22.

```bash
git clone https://github.com/oukraal/Grokbot.git
cd Grokbot
npm install
```

Optional — Operator chat (xAI):

```bash
export XAI_API_KEY=your_key
```

Start the console:

```bash
npm run dev
```

Open the URL it prints (typically port 8080 on this box). From another machine on the desk network, use the Spark’s hostname.

### First stack on the metal

In Sparkforge, **Stand up unrestricted stack** (or ask the Operator). That is Ollama + Dolphin 8B sidecar + Dolphin 70B as the desk model.

The same work on the box, without the UI:

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull dolphin-llama3:8b
ollama pull dolphin-llama3:70b
ollama serve
```

Then `ollama run dolphin-llama3:70b`.

vLLM NVFP4 (fast 35B on GB10) uses the Spark-specific image, not a generic pip install. Prefer the **NVFP4 sprinter** playbook in the app, or [spark-vllm-docker](https://github.com/eugr/spark-vllm-docker).

## What the console does

| View | Purpose |
|---|---|
| Device | GB10 telemetry twin — GPU, unified memory, power, temp |
| Models | Catalog sized for 128 GB, unrestricted / NVFP4 / coder |
| Runtimes | Ollama, vLLM, llama.cpp, TensorRT-LLM, Open WebUI, LiteLLM |
| Playbooks | One-shot stacks (sovereign, 120B, NVFP4, coder, dual) |
| Jobs | Install / pull / serve log |
| Operator | Natural-language control of the same playbooks |

The live gauges are a faithful GB10 twin so you can rehearse pulls and memory fit before (or while) you run them on the desk. Served-model chat uses your `XAI_API_KEY` as the inference proxy when set.

## Scripts

- `npm run dev` — console on `0.0.0.0:8080`
- `npm run build` — production build
- `npm run typecheck` — TypeScript

## Hardware this is sized for

- GB10 Grace Blackwell Superchip
- 128 GB coherent LPDDR5x
- 4 TB NVMe
- CUDA 13 / DGX OS 7
