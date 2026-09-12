import { useState } from "react";
import { runLocalModel } from "@/lib/agent/chat";
import { modelById } from "@/lib/spark/catalog";
import { useSpark } from "@/lib/spark/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Turn = { role: "user" | "assistant"; text: string };

export function Playground() {
  const id = useSpark((s) => s.playgroundModelId);
  const setPlayground = useSpark((s) => s.setPlayground);
  const installed = useSpark((s) => s.models.find((m) => m.catalogId === id && m.status === "serving"));
  const cat = id ? modelById(id) : undefined;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id || !cat) return null;
  const model = cat;

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setError(null);
    const next = [...turns, { role: "user" as const, text }];
    setTurns(next);
    setBusy(true);
    try {
      const res = await runLocalModel({
        data: {
          modelName: model.name,
          unrestricted: model.tags.includes("unrestricted"),
          messages: next.map((t) => ({ role: t.role, content: t.text })),
        },
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setTurns([...next, { role: "assistant", text: res.text || "…" }]);
      }
    } catch {
      setError("Inference failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_rgba(236,234,228,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Talk to {model.name}</p>
          <p className="text-xs text-muted-foreground">
            {installed ? `${installed.quant} · local on the twin` : "Not serving — deploy first for a live endpoint."}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setPlayground(null)}>
          Close
        </Button>
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {turns.length === 0 ? (
          <p className="text-sm text-subtle">
            {model.tags.includes("unrestricted")
              ? "Unrestricted local model. Ask anything you would ask a desk-side assistant."
              : "Open-weight model on this Spark. Ask a question."}
          </p>
        ) : null}
        {turns.map((t, i) => (
          <div
            key={`${t.role}-${i}`}
            className={
              t.role === "user"
                ? "ml-6 rounded-lg bg-elevated px-3 py-2 text-sm"
                : "mr-6 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground"
            }
          >
            {t.text}
          </div>
        ))}
        {busy ? <p className="text-xs text-subtle">Generating…</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${model.name}`}
          aria-label="Message the local model"
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
