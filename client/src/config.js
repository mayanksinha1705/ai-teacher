// Single canonical source of truth for TruGen configuration.
// Confirmed via the TruGen dashboard (Share > Agent ID, Status: Active) on
// 2026-09-05 — this is the real published agent. Override via
// VITE_TRUGEN_AGENT_ID in client/.env (or .env.local) if it's ever
// re-published under a new ID — do not hardcode the ID anywhere else in
// the client.
export const TRUGEN_AGENT_ID =
  import.meta.env.VITE_TRUGEN_AGENT_ID || "2a1389b1-0b60-4e72-b745-e912a38731e5";

// Documented embed base — see https://docs.trugen.ai/docs/integrations/embed-via-iFrame
// Full URL shape: `${TRUGEN_EMBED_BASE}/{agentId}?username=...&id=...&context=...`
export const TRUGEN_EMBED_BASE = "https://app.trugen.ai/embed";
