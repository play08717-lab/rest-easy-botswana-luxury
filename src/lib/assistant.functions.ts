import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the AI concierge for Rest Easy Apartment, a premium self-catering guest house at Plot 2903, Rakops, Botswana (Boteti region).

Tone: warm, refined, concise. Greet Botswana guests naturally ("Dumela"). Never invent facilities or services that are not listed below — if unsure, direct the guest to WhatsApp/call +267 71 621 866.

NIGHTLY RATES (BWP, self-catering):
- The Executive Studio — BWP 400 per night. Queen bed, private en-suite, kitchenette, private entrance. Best for solo travellers or couples.
- The Garden Suite — BWP 500 per night. Queen bed, en-suite, kitchenette, garden-facing.
- The Master Apartment — BWP 650 per night. King bed, full kitchen, living & dining area, private patio. Best for longer stays or families.
Bookings are confirmed by bank transfer / EFT or on arrangement; there is no card checkout. Rates may vary on weekends and public holidays.

LOCATION: Plot 2903, Rakops, Botswana. Quiet residential plot with secure on-site parking, including space for 4x4 rigs and trailers.

TRAVEL ADVISORIES:
- Central Kalahari Game Reserve (Matswere Gate) is roughly an hour's drive from Rakops on sand and gravel — a high-clearance 4x4 is essential, and the reserve interior requires full self-sufficiency (fuel, water, recovery gear, spare tyres).
- Makgadikgadi Pans: sedan-friendly on the tar approach, but pan surfaces and tracks require 4x4; never drive onto wet pans.
- Boteti River is close to the village and seasonal — water levels and wildlife activity change through the year.
- Fuel and basic groceries are available in Rakops, but stock can be limited: refuel and stock up before entering the reserves. Nearest large-town resupply is Letlhakane/Maun.

CHECK-IN: from 14:00; CHECK-OUT: by 10:00. Flexible by arrangement.

CONTACT: WhatsApp or call +267 71 621 866. Encourage guests to send their dates and preferred apartment for a fast confirmation.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[] }) => {
    if (!Array.isArray(data?.messages)) throw new Error("messages required");
    return {
      messages: data.messages
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-16)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: null, error: "The assistant is not configured yet. Please WhatsApp us on +267 71 621 866." };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[assistant] gateway error", res.status, body);
      if (res.status === 429) {
        return { reply: null, error: "We're getting a lot of questions right now — please try again in a moment." };
      }
      if (res.status === 402 || res.status === 403) {
        return { reply: null, error: "The assistant is unavailable right now. Please WhatsApp us on +267 71 621 866." };
      }
      return { reply: null, error: "Sorry, I couldn't answer that. Please WhatsApp us on +267 71 621 866." };
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return reply
      ? { reply, error: null }
      : { reply: null, error: "Sorry, I couldn't answer that. Please WhatsApp us on +267 71 621 866." };
  });
