import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getAssistantConfig,
  resetAssistantConfig,
  updateAssistantConfig,
} from "@/lib/assistant-config.functions";
import {
  ASSISTANT_CONFIG_FIELDS,
  DEFAULT_ASSISTANT_CONFIG,
  buildSystemPrompt,
  type AssistantConfig,
} from "@/lib/assistant-prompt";

export const Route = createFileRoute("/_authenticated/admin/assistant")({
  // Super-admin only — managers and other staff are bounced back to the dashboard.
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) throw redirect({ to: "/auth" });
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw redirect({ to: "/admin" });
  },

  head: () => ({
    meta: [
      { title: "Concierge Settings — Rest Easy Apartment Admin" },
      {
        name: "description",
        content:
          "Update the AI concierge's rates, location, travel advisories and contact number without redeploying.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistantAdmin,
});

function AssistantAdmin() {
  const load = useServerFn(getAssistantConfig);
  const save = useServerFn(updateAssistantConfig);
  const reset = useServerFn(resetAssistantConfig);

  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_ASSISTANT_CONFIG);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load()
      .then((res) => {
        setConfig(res.config);
        setUpdatedAt(res.updatedAt);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Couldn't load the concierge settings.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ data: config });
      setUpdatedAt(new Date().toISOString());
      toast.success("Concierge details updated — live immediately.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the concierge settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await reset();
      setConfig(res.config);
      setUpdatedAt(new Date().toISOString());
      toast.success("Restored the default concierge details.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't restore the defaults.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">AI Concierge</p>
        <h1 className="mt-2 font-display text-3xl">Concierge knowledge</h1>
        <p className="mt-2 max-w-2xl text-sm text-paper/60">
          These details are used by the chat concierge on the website. Changes take effect on the
          next guest message — no redeployment needed.
        </p>
        {updatedAt && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-paper/40">
            Last updated {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-paper/50">Loading…</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {ASSISTANT_CONFIG_FIELDS.map((field) => (
              <div key={field.key} className="rounded-xl border border-gold/15 bg-paper/[0.03] p-5">
                <label
                  htmlFor={field.key}
                  className="text-[11px] uppercase tracking-[0.25em] text-gold"
                >
                  {field.label}
                </label>
                <p className="mt-1 text-xs text-paper/50">{field.hint}</p>
                <textarea
                  id={field.key}
                  rows={field.rows}
                  value={config[field.key]}
                  onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-3 w-full resize-y rounded-lg border border-gold/20 bg-dark/60 p-3 text-sm text-paper/90 outline-none focus:border-gold/60"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold text-dark hover:bg-gold-light text-[11px] uppercase tracking-[0.2em]"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
              className="border-gold/40 bg-transparent text-paper hover:bg-gold/10 text-[11px] uppercase tracking-[0.2em]"
            >
              Restore defaults
            </Button>
          </div>

          <div className="rounded-xl border border-gold/15 bg-paper/[0.02] p-5">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-gold">
              Preview — what the concierge is told
            </h2>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-paper/70">
              {buildSystemPrompt(config)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
