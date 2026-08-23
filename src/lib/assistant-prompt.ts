export type AssistantConfig = {
  tone_notes: string;
  rates_text: string;
  location_text: string;
  advisories_text: string;
  checkin_text: string;
  contact_text: string;
  extra_notes: string;
};

export const ASSISTANT_CONFIG_FIELDS: {
  key: keyof AssistantConfig;
  label: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "tone_notes",
    label: "Tone & guardrails",
    hint: "How the concierge should speak, and what it must never invent.",
    rows: 4,
  },
  {
    key: "rates_text",
    label: "Nightly rates (BWP)",
    hint: "One apartment per line, including rate and payment terms.",
    rows: 8,
  },
  {
    key: "location_text",
    label: "Location & parking",
    hint: "Street address, plot number and parking details.",
    rows: 3,
  },
  {
    key: "advisories_text",
    label: "Travel & 4x4 advisories",
    hint: "CKGR, Makgadikgadi Pans, Boteti River, fuel and supplies.",
    rows: 8,
  },
  {
    key: "checkin_text",
    label: "Check-in / check-out",
    hint: "Arrival and departure times, and flexibility.",
    rows: 3,
  },
  {
    key: "contact_text",
    label: "Contact details",
    hint: "Phone / WhatsApp number the concierge should give out.",
    rows: 3,
  },
  {
    key: "extra_notes",
    label: "Extra notes (optional)",
    hint: "Seasonal offers, temporary notices, anything else the concierge should know.",
    rows: 5,
  },
];

export const DEFAULT_ASSISTANT_CONFIG: AssistantConfig = {
  tone_notes:
    'Tone: warm, refined, concise. Greet Botswana guests naturally ("Dumela"). Never invent facilities or services that are not listed below — if unsure, direct the guest to WhatsApp/call +267 71 621 866.',
  rates_text: `- The Executive Studio — BWP 400 per night. Queen bed, private en-suite, kitchenette, private entrance. Best for solo travellers or couples.
- The Garden Suite — BWP 500 per night. Queen bed, en-suite, kitchenette, garden-facing.
- The Master Apartment — BWP 650 per night. King bed, full kitchen, living & dining area, private patio. Best for longer stays or families.
Bookings are confirmed by bank transfer / EFT or on arrangement; there is no card checkout. Rates may vary on weekends and public holidays.`,
  location_text:
    "Plot 2903, Rakops, Botswana. Quiet residential plot with secure on-site parking, including space for 4x4 rigs and trailers.",
  advisories_text: `- Central Kalahari Game Reserve (Matswere Gate) is roughly an hour's drive from Rakops on sand and gravel — a high-clearance 4x4 is essential, and the reserve interior requires full self-sufficiency (fuel, water, recovery gear, spare tyres).
- Makgadikgadi Pans: sedan-friendly on the tar approach, but pan surfaces and tracks require 4x4; never drive onto wet pans.
- Boteti River is close to the village and seasonal — water levels and wildlife activity change through the year.
- Fuel and basic groceries are available in Rakops, but stock can be limited: refuel and stock up before entering the reserves. Nearest large-town resupply is Letlhakane/Maun.`,
  checkin_text: "CHECK-IN: from 14:00; CHECK-OUT: by 10:00. Flexible by arrangement.",
  contact_text:
    "WhatsApp or call +267 71 621 866. Encourage guests to send their dates and preferred apartment for a fast confirmation.",
  extra_notes: "",
};

export function buildSystemPrompt(config: AssistantConfig): string {
  const sections = [
    `You are the AI concierge for Rest Easy Apartment, a premium self-catering guest house in Rakops, Botswana (Boteti region).`,
    config.tone_notes.trim(),
    config.rates_text.trim() && `NIGHTLY RATES (BWP, self-catering):\n${config.rates_text.trim()}`,
    config.location_text.trim() && `LOCATION: ${config.location_text.trim()}`,
    config.advisories_text.trim() && `TRAVEL ADVISORIES:\n${config.advisories_text.trim()}`,
    config.checkin_text.trim(),
    config.contact_text.trim() && `CONTACT: ${config.contact_text.trim()}`,
    config.extra_notes.trim() && `ADDITIONAL NOTES:\n${config.extra_notes.trim()}`,
  ].filter(Boolean);

  return sections.join("\n\n");
}

/** Fallback used when the saved configuration cannot be loaded. */
export const SYSTEM_PROMPT = buildSystemPrompt(DEFAULT_ASSISTANT_CONFIG);
