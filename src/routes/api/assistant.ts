import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/assistant-prompt";

type ChatMessage = { role: "user" | "assistant"; content: string };

function errorStream(message: string) {
  return new Response(message, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return errorStream(
            "The assistant is not configured yet. Please WhatsApp us on +267 71 621 866.",
          );
        }

        let messages: ChatMessage[] = [];
        try {
          const body = (await request.json()) as { messages?: unknown };
          if (!Array.isArray(body.messages)) return new Response("messages required", { status: 400 });
          messages = (body.messages as ChatMessage[])
            .filter(
              (m) =>
                (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string",
            )
            .slice(-16)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
        } catch {
          return new Response("invalid body", { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.7-flash",
            stream: true,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error("[assistant] gateway error", upstream.status, detail);
          if (upstream.status === 429) {
            return errorStream(
              "We're getting a lot of questions right now — please try again in a moment.",
            );
          }
          return errorStream(
            "Sorry, I couldn't answer that. Please WhatsApp us on +267 71 621 866.",
          );
        }

        // Convert the gateway's SSE stream into plain text deltas.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const reader = upstream.body.getReader();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              let emitted = "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const payload = trimmed.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const json = JSON.parse(payload) as {
                    choices?: { delta?: { content?: string } }[];
                  };
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) emitted += delta;
                } catch {
                  // ignore partial/keep-alive frames
                }
              }
              if (emitted) {
                controller.enqueue(encoder.encode(emitted));
                return;
              }
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
