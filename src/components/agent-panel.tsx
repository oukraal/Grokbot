import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { runOperator } from "@/lib/agent/chat";
import { matchIntent } from "@/lib/agent/intent";
import { useSpark } from "@/lib/spark/store";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";

const SUGGESTIONS = [
  "Stand up an unrestricted local stack",
  "What's the biggest model that fits?",
  "Install vLLM and pull the NVFP4 sprinter",
  "Give me a local coder at Q8",
];

export function AgentPanel() {
  const chat = useSpark((s) => s.chat);
  const pushChat = useSpark((s) => s.pushChat);
  const applyAgentJobs = useSpark((s) => s.applyAgentJobs);
  const snapshot = useSpark((s) => s.snapshot);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setDraft("");
    setError(null);
    pushChat({ role: "user", text: trimmed });
    setBusy(true);
    const local = matchIntent(trimmed);
    if (local.length) {
      for (const action of local) applyAgentJobs(action.name, action.args);
    }
    try {
      const history = [
        ...useSpark.getState().chat.slice(-16).map((m) => ({
          role: m.role,
          content: m.text,
        })),
      ];
      const res = await runOperator({
        data: { messages: history, snapshot: snapshot() },
      });
      if (!res.ok) {
        if (local.length) {
          pushChat({
            role: "assistant",
            text: "Queued on the twin. Watch Device and Jobs while it comes up.",
          });
        } else {
          setError(res.error);
          pushChat({ role: "assistant", text: res.error });
        }
      } else {
        for (const action of res.actions) {
          const dup = local.some(
            (l) => l.name === action.name && l.args.id === action.args.id && l.args.modelId === action.args.modelId,
          );
          if (!dup) applyAgentJobs(action.name, action.args);
        }
        pushChat({ role: "assistant", text: res.text });
      }
    } catch {
      const msg = local.length
        ? "Queued on the twin. Watch Device and Jobs while it comes up."
        : "Operator could not reach the model. Playbooks still work.";
      if (!local.length) setError(msg);
      pushChat({ role: "assistant", text: msg });
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card shadow-[inset_1px_0_0_rgba(236,234,228,0.08)]">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-medium">Operator</p>
          <p className="text-xs text-subtle">GB10 specialist</p>
        </div>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {chat.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-4 rounded-lg bg-elevated px-3 py-2 text-sm"
                : "mr-2 text-sm text-muted-foreground"
            }
          >
            {m.text}
          </div>
        ))}
        {busy ? (
          <p className="text-xs text-subtle">
            <span className="shimmer bg-clip-text">Thinking on the box…</span>
          </p>
        ) : null}
        {error && !busy ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      {chat.length <= 2 ? (
        <div className="flex flex-col gap-2 px-4 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="rounded-lg bg-elevated px-3 py-2.5 text-left text-sm text-foreground shadow-[0_0_0_1px_rgba(236,234,228,0.06)] hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            placeholder="Ask the operator to install, pull, or serve…"
            className="min-h-14 resize-none"
            aria-label="Message the operator"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !draft.trim()}
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    </aside>
  );
}
