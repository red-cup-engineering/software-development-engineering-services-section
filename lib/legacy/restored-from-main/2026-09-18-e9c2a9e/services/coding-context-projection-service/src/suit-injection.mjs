const list = (value) => Array.isArray(value) ? value : [];
const value = (item, ...keys) => keys.map((key) => item?.[key]).find((candidate) => typeof candidate === "string" && candidate.trim() !== "") ?? null;

export function renderSuitInjection(carriers, params = {}) {
  const suit = carriers.suit ?? {};
  const goals = list(carriers.goals?.goals).filter((item) => !["complete", "completed", "closed"].includes(item.status));
  const work = list(carriers.work?.work ?? carriers.work?.items).filter((item) => !["complete", "completed", "closed"].includes(item.status));
  const findings = list(carriers.findings?.findings).slice(-3);
  const operations = list(carriers.operations?.entries).slice(-4);
  const campaign = carriers.campaign ?? null;
  const session = carriers.session ?? null;
  const lines = ["# NOG suit", value(suit, "intent", "focus") && `Intent: ${value(suit, "intent", "focus")}`, session?.session && `Session: ${session.session}`, "", "## Active goals", ...goals.slice(0, 4).map((item) => `- ${value(item, "title", "objective", "summary", "id")} [${item.status ?? "open"}]`), "", "## Work front", ...work.slice(0, 6).map((item) => `- ${value(item, "title", "summary", "id")} [${item.status ?? "active"}]`), campaign?.summary && "", campaign?.summary && "## Campaign", campaign?.summary && campaign.summary, findings.length > 0 && "", findings.length > 0 && "## Recent learning", ...findings.map((item) => `- ${value(item, "summary", "finding", "title", "id")}`), operations.length > 0 && "", operations.length > 0 && "## Recent operations", ...operations.map((item) => `- ${value(item, "operation", "summary", "kind", "id")}`), "", "## Interfaces", ...list(suit.interfaces ?? suit.nextInterfaces).slice(0, 6).map((item) => `- ${value(item, "bin", "name", "id")}${item.purpose ? `: ${item.purpose}` : ""}`)].filter((line) => line !== null && line !== false);
  const maxCharacters = Number(params.maxCharacters ?? 12000);
  const rendered = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return rendered.length <= maxCharacters ? `${rendered}\n` : `${rendered.slice(0, Math.max(0, maxCharacters - 20)).trimEnd()}\n[bounded by NOG]\n`;
}
