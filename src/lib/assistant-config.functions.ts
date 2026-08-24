import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_ASSISTANT_CONFIG,
  buildSystemPrompt,
  type AssistantConfig,
} from "@/lib/assistant-prompt";

const KEYS = Object.keys(DEFAULT_ASSISTANT_CONFIG) as (keyof AssistantConfig)[];

function normalize(input: Partial<Record<keyof AssistantConfig, unknown>>): AssistantConfig {
  const out = {} as AssistantConfig;
  for (const key of KEYS) {
    const value = input[key];
    out[key] = typeof value === "string" ? value.slice(0, 8000) : DEFAULT_ASSISTANT_CONFIG[key];
  }
  return out;
}

async function assertStaff(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "manager" }),
  ]);
  if (!isAdmin && !isManager) throw new Error("Forbidden");
}

export const getAssistantConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("assistant_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;

    const config = normalize((data ?? DEFAULT_ASSISTANT_CONFIG) as Partial<AssistantConfig>);
    return {
      config,
      updatedAt: (data?.updated_at as string | undefined) ?? null,
      preview: buildSystemPrompt(config),
    };
  });

export const updateAssistantConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Partial<AssistantConfig>) => normalize(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("assistant_config").update(data).eq("id", 1);
    if (error) throw error;

    await context.supabase.from("activity_log").insert({
      actor_id: context.userId,
      action: "assistant_config_updated",
      target_type: "assistant_config",
    });

    return { config: data, preview: buildSystemPrompt(data) };
  });

export const resetAssistantConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("assistant_config")
      .update(DEFAULT_ASSISTANT_CONFIG)
      .eq("id", 1);
    if (error) throw error;
    return {
      config: DEFAULT_ASSISTANT_CONFIG,
      preview: buildSystemPrompt(DEFAULT_ASSISTANT_CONFIG),
    };
  });
