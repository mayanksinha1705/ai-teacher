// Thin client for a locally running Ollama server.
// Requires `ollama serve` running and the model already pulled, e.g.:
//   ollama pull gpt-oss:120b-cloud

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

/**
 * Send a chat request to Ollama and return the assistant's raw text reply.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ temperature?: number }} options
 */
export async function chatWithOllama(messages, options = {}) {
  let res;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.4,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach Ollama at ${OLLAMA_URL}. Make sure "ollama serve" is running ` +
        `and model "${OLLAMA_MODEL}" is pulled (ollama pull ${OLLAMA_MODEL}). ` +
        `(${networkErr.message})`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ollama request failed (${res.status}): ${text || res.statusText}. ` +
        `Is model "${OLLAMA_MODEL}" pulled?`
    );
  }

  const data = await res.json();
  return data?.message?.content ?? "";
}

/**
 * Ask Ollama for a strictly-JSON response and parse it.
 * Retries once with a stricter instruction if parsing fails.
 */
export async function chatForJSON(messages, options = {}) {
  const jsonInstruction = {
    role: "system",
    content:
      "Respond with ONLY valid JSON. No markdown code fences, no commentary, no preamble.",
  };

  const raw = await chatWithOllama([jsonInstruction, ...messages], options);
  const parsed = tryParseJSON(raw);
  if (parsed) return parsed;

  // Retry once, feeding the bad output back and asking for a fix.
  const retryRaw = await chatWithOllama(
    [
      jsonInstruction,
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content:
          "That was not valid JSON. Reply again with ONLY the corrected valid JSON object, nothing else.",
      },
    ],
    options
  );
  const retryParsed = tryParseJSON(retryRaw);
  if (retryParsed) return retryParsed;

  throw new Error("Model did not return valid JSON after retry.");
}

function tryParseJSON(text) {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage the first {...} or [...] block.
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export { OLLAMA_MODEL, OLLAMA_URL };
