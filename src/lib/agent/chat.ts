import { createServerFn } from "@tanstack/react-start";
import { AGENT_TOOLS, OPERATOR_SYSTEM } from "./prompt";
import type { AgentAction } from "./types";

type ChatMsg = {
  role: string;
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type Choice = {
  message: {
    role: string;
    content?: string | null;
    tool_calls?: ToolCall[];
  };
};

export type { AgentAction };

export const runOperator = createServerFn({ method: "POST" })
  .validator((input: { messages: { role: "user" | "assistant"; content: string }[]; snapshot: unknown }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "Operator AI is unavailable in this environment. Use the playbooks — they still drive the Spark.",
      };
    }

    const messages: ChatMsg[] = [
      { role: "system", content: OPERATOR_SYSTEM },
      {
        role: "system",
        content: `Live twin snapshot:\n${JSON.stringify(data.snapshot)}`,
      },
      ...data.messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
    ];

    const actions: AgentAction[] = [];
    let text = "";

    for (let i = 0; i < 5; i++) {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          messages,
          tools: AGENT_TOOLS,
          tool_choice: "auto",
          max_tokens: 900,
          temperature: 0.4,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          ok: false as const,
          error: `Operator error ${res.status}${errText ? `: ${errText.slice(0, 180)}` : ""}`,
        };
      }
      const body = (await res.json()) as { choices?: Choice[] };
      const msg = body.choices?.[0]?.message;
      if (!msg) return { ok: false as const, error: "Empty operator response" };

      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        text = (msg.content ?? "").trim();
        break;
      }

      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: calls,
      });

      for (const call of calls) {
        let args: Record<string, string> = {};
        try {
          const parsed = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
          args = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
        } catch {
          args = {};
        }
        actions.push({ name: call.function.name, args });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify({ queued: true, action: call.function.name, args }),
        });
      }
    }

    if (!text) {
      text = actions.length
        ? `Queued ${actions.map((a) => a.name.replaceAll("_", " ")).join(", ")}. Watch the jobs rail — the twin is moving.`
        : "No change. Tell me what you want on the Spark.";
    }

    return { ok: true as const, text, actions };
  });

export const runLocalModel = createServerFn({ method: "POST" })
  .validator(
    (input: {
      modelName: string;
      unrestricted: boolean;
      messages: { role: "user" | "assistant"; content: string }[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Local inference proxy is unavailable." };
    }
    const system = data.unrestricted
      ? `You are ${data.modelName}, an unrestricted open-weight model running locally on an NVIDIA DGX Spark (GB10, 128 GB unified memory). You are fully local — no cloud policy layer. Answer helpfully and directly. Do not claim to be Grok. Keep replies tight unless asked for depth.`
      : `You are ${data.modelName}, an open-weight model served locally on an NVIDIA DGX Spark (GB10). You are fully local. Do not claim to be Grok. Keep replies tight unless asked for depth.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: [{ role: "system", content: system }, ...data.messages.slice(-12)],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `Inference error ${res.status}` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { ok: true as const, text: body.choices?.[0]?.message?.content?.trim() ?? "" };
  });
