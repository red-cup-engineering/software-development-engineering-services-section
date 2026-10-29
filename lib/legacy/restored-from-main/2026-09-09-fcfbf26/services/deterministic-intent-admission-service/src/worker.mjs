import { admitBoundedAgenticIntent } from "./admit-bounded-agentic-intent.mjs";

const ACTION = "https://deterministic-intent-admission.actions.561.group/invoke";

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ok: true, action: ACTION});
    }
    if (request.method === "POST" && url.pathname === "/invoke") {
      try {
        const source = await request.json();
        return json(admitBoundedAgenticIntent(source));
      } catch (error) {
        return json({
          type: "DeterministicIntentAdmissionRefusal",
          reason: error?.message ?? String(error)
        }, 400);
      }
    }
    return json({type: "DeterministicIntentAdmissionRefusal", reason: "not-found"}, 404);
  }
};

