import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { submitDeletionRequest, getDeletionRequestStatus } from "@/lib/deletion.functions";

export const Route = createFileRoute("/data-request")({
  head: () => ({
    meta: [
      { title: "Data Deletion Request — Rest Easy Apartment" },
      { name: "description", content: "Request deletion of your personal data held by Rest Easy Apartment, or track an existing request." },
      { property: "og:title", content: "Data Deletion Request — Rest Easy Apartment" },
      { property: "og:description", content: "Submit or track a GDPR-style data deletion request." },
    ],
    links: [{ rel: "canonical", href: "/data-request" }],
  }),
  component: DataRequestPage,
});

type StatusResult = Awaited<ReturnType<typeof getDeletionRequestStatus>>;

function DataRequestPage() {
  const submit = useServerFn(submitDeletionRequest);
  const track = useServerFn(getDeletionRequestStatus);

  const [tab, setTab] = useState<"submit" | "track">("submit");
  const [f, setF] = useState({
    lookup_type: "booking_reference" as "booking_reference" | "email",
    lookup_value: "",
    requester_name: "",
    requester_email: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [submitted, setSubmitted] = useState<{ id: string; matches: number } | null>(null);

  const [trackId, setTrackId] = useState("");
  const [trackResult, setTrackResult] = useState<StatusResult | null>(null);

  return (
    <>
      <PageHero
        eyebrow="Your rights"
        title={<>Data <em className="text-gold-light">Deletion</em> Request</>}
        intro="Ask us to delete the personal information we hold about you. We process requests within 30 days and will confirm by email."
      />

      <div className="mt-8 flex gap-6 border-b border-gold/10 pb-2">
        {(["submit", "track"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[11px] uppercase tracking-[0.25em] pb-2 ${tab === t ? "text-gold border-b border-gold" : "text-paper/50 hover:text-paper"}`}
          >
            {t === "submit" ? "Submit request" : "Track request"}
          </button>
        ))}
      </div>

      {tab === "submit" && (
        <div className="mt-10 max-w-2xl">
          {submitted ? (
            <div className="border border-gold/30 p-8 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Request received</p>
              <p className="font-display text-2xl">Your reference</p>
              <p className="font-mono text-gold-light break-all">{submitted.id}</p>
              <p className="text-paper/70 text-sm">
                Save this reference to check status on the “Track request” tab. We found {submitted.matches} matching booking record(s). Our team will review and respond within 30 days.
              </p>
              <button
                onClick={() => { setSubmitted(null); setF({ ...f, lookup_value: "", reason: "" }); }}
                className="text-[11px] uppercase tracking-[0.25em] text-paper/60 hover:text-gold"
              >
                Submit another
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault(); setBusy(true); setErr("");
                try {
                  const res = await submit({ data: {
                    lookup_type: f.lookup_type,
                    lookup_value: f.lookup_value,
                    requester_name: f.requester_name || null,
                    requester_email: f.requester_email || null,
                    reason: f.reason || null,
                  } });
                  setSubmitted(res);
                } catch (er) { setErr(er instanceof Error ? er.message : "Failed to submit"); }
                setBusy(false);
              }}
              className="space-y-6"
            >
              <Field label="Look up by">
                <select value={f.lookup_type} onChange={(e) => setF({ ...f, lookup_type: e.target.value as typeof f.lookup_type })} className="i">
                  <option value="booking_reference">Booking reference (e.g. RE-2026-000123)</option>
                  <option value="email">Email address used at booking</option>
                </select>
              </Field>
              <Field label={f.lookup_type === "booking_reference" ? "Booking reference" : "Email address"}>
                <input required value={f.lookup_value} onChange={(e) => setF({ ...f, lookup_value: e.target.value })} className="i" />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Your name (optional)">
                  <input value={f.requester_name} onChange={(e) => setF({ ...f, requester_name: e.target.value })} className="i" />
                </Field>
                <Field label="Contact email (optional)">
                  <input type="email" value={f.requester_email} onChange={(e) => setF({ ...f, requester_email: e.target.value })} className="i" />
                </Field>
              </div>
              <Field label="Reason (optional)">
                <textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} rows={4} className="i" maxLength={1000} />
              </Field>
              <p className="text-xs text-paper/50">
                Some information may be retained where required by law (e.g. financial records). See our{" "}
                <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>.
              </p>
              {err && <p className="text-red-400 text-sm">{err}</p>}
              <button disabled={busy} className="bg-gold text-dark px-8 py-3 text-[11px] uppercase tracking-[0.25em] disabled:opacity-50">
                {busy ? "Submitting…" : "Submit request"}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "track" && (
        <div className="mt-10 max-w-2xl space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault(); setBusy(true); setErr(""); setTrackResult(null);
              try {
                const r = await track({ data: { id: trackId.trim() } });
                setTrackResult(r);
              } catch (er) { setErr(er instanceof Error ? er.message : "Not found"); }
              setBusy(false);
            }}
            className="flex gap-3 items-end"
          >
            <Field label="Request reference">
              <input required value={trackId} onChange={(e) => setTrackId(e.target.value)} className="i" placeholder="uuid from your submission" />
            </Field>
            <button disabled={busy} className="bg-gold text-dark px-6 py-3 text-[11px] uppercase tracking-[0.25em] disabled:opacity-50 shrink-0">
              {busy ? "…" : "Check status"}
            </button>
          </form>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          {trackResult && (
            <div className="border border-gold/20 p-6 space-y-3 text-sm">
              <p><span className="text-paper/50">Reference:</span> <span className="font-mono text-gold-light">{trackResult.id}</span></p>
              <p><span className="text-paper/50">Status:</span> <span className="uppercase tracking-widest text-gold">{trackResult.status.replace("_", " ")}</span></p>
              <p><span className="text-paper/50">Submitted:</span> {new Date(trackResult.created_at).toLocaleString()}</p>
              {trackResult.processed_at && (
                <p><span className="text-paper/50">Processed:</span> {new Date(trackResult.processed_at).toLocaleString()}</p>
              )}
              {trackResult.notes && <p className="text-paper/70">{trackResult.notes}</p>}
            </div>
          )}
        </div>
      )}

      <style>{`.i{width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(201,162,76,0.2);padding:0.65rem 0.85rem;color:#f7f4ee;font-size:0.9rem}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-paper/60">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
