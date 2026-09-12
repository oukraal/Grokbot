import type { AgentAction } from "./types";
import type { PlaybookId } from "@/lib/spark/types";

const PLAYBOOKS: { id: PlaybookId; re: RegExp }[] = [
  { id: "reset", re: /\b(reset|factory|wipe|start over)\b/i },
  { id: "coder", re: /\b(coder|coding|qwen3 coder|repo[- ]scale)\b/i },
  { id: "nvfp4-fast", re: /\b(nvfp4|sprinter|vllm|fastest|throughput)\b/i },
  { id: "max-120b", re: /\b(120b|nemotron|biggest|largest|max capab)/i },
  { id: "dual", re: /\b(dual|both|sidecar|litellm)\b/i },
  {
    id: "sovereign",
    re: /\b(unrestricted|uncensored|sovereign|stand up|set up|get me running|dolphin|desk model)\b/i,
  },
];

export function matchIntent(text: string): AgentAction[] {
  const t = text.trim();
  if (!t) return [];
  for (const p of PLAYBOOKS) {
    if (p.re.test(t) && /\b(install|pull|run|stand|set up|setup|deploy|serve|reset|factory|want|give|stack)\b/i.test(t)) {
      return [{ name: "run_playbook", args: { id: p.id } }];
    }
  }
  if (/\b(unrestricted|sovereign stack|stand up)\b/i.test(t)) {
    return [{ name: "run_playbook", args: { id: "sovereign" } }];
  }
  return [];
}
