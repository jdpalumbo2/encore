import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  buildRetryUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/encore-prompt";
import { archetypes, venues } from "@/lib/seed-data";
import type { IntakeAnswers, Package, PackageStage, StageKind, Venue } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

interface RawStage {
  order: number;
  kind: StageKind;
  venueId: string;
  timeOfEvening: string;
  why: string;
  transition?: string;
}

interface RawPackage {
  archetypeId: string;
  archetypeName: string;
  headline: string;
  signal: string;
  stages: RawStage[];
  narrative: string;
  conversationStarters: string[];
  dontBringUp: string;
  priceEstimate: {
    low: number;
    high: number;
    perPerson: boolean;
    conciergeFeeNote: string;
  };
}

const STAGE_KINDS: StageKind[] = [
  "cocktails",
  "dinner",
  "nightcap",
  "coffee",
  "brunch",
  "walk",
  "cultural",
  "activity",
  "water",
  "browse",
  "show",
];

const presentPackagesTool: Anthropic.Tool = {
  name: "present_packages",
  description:
    "Present three Encore packages to the client. Each package is an instantiation of a different archetype, with each stage filled by a real venue.",
  input_schema: {
    type: "object",
    required: ["packages"],
    properties: {
      packages: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          required: [
            "archetypeId",
            "archetypeName",
            "headline",
            "signal",
            "stages",
            "narrative",
            "conversationStarters",
            "dontBringUp",
            "priceEstimate",
          ],
          properties: {
            archetypeId: {
              type: "string",
              enum: archetypes.map((a) => a.id),
            },
            archetypeName: { type: "string" },
            headline: { type: "string" },
            signal: { type: "string" },
            stages: {
              type: "array",
              minItems: 2,
              maxItems: 4,
              items: {
                type: "object",
                required: ["order", "kind", "venueId", "timeOfEvening", "why"],
                properties: {
                  order: { type: "integer", minimum: 1 },
                  kind: { type: "string", enum: STAGE_KINDS },
                  venueId: {
                    type: "string",
                    enum: venues.map((v) => v.id),
                  },
                  timeOfEvening: { type: "string" },
                  why: { type: "string" },
                  transition: { type: "string" },
                },
              },
            },
            narrative: { type: "string" },
            conversationStarters: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
            dontBringUp: { type: "string" },
            priceEstimate: {
              type: "object",
              required: ["low", "high", "perPerson", "conciergeFeeNote"],
              properties: {
                low: { type: "integer", minimum: 0 },
                high: { type: "integer", minimum: 0 },
                perPerson: { type: "boolean" },
                conciergeFeeNote: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

const venueById = new Map(venues.map((v) => [v.id, v]));

function hydratePackages(raw: RawPackage[]): Package[] {
  const result: Package[] = [];
  for (const r of raw) {
    const stages: PackageStage[] = [];
    let dropped = false;
    for (const s of r.stages) {
      const venue: Venue | undefined = venueById.get(s.venueId);
      if (!venue) {
        console.warn(
          `[curate] dropping package ${r.archetypeId}: unknown venueId ${s.venueId}`,
        );
        dropped = true;
        break;
      }
      stages.push({
        order: s.order,
        kind: s.kind,
        venueId: s.venueId,
        venue,
        timeOfEvening: s.timeOfEvening,
        why: s.why,
        transition: s.transition,
      });
    }
    if (dropped) continue;
    stages.sort((a, b) => a.order - b.order);

    result.push({
      id: r.archetypeId,
      archetypeId: r.archetypeId,
      archetypeName: r.archetypeName,
      headline: r.headline,
      signal: r.signal,
      stages,
      narrative: r.narrative,
      conversationStarters: r.conversationStarters,
      dontBringUp: r.dontBringUp,
      priceEstimate: r.priceEstimate,
    });
  }
  return result;
}

function distinctArchetypeIds(pkgs: Package[]): boolean {
  return new Set(pkgs.map((p) => p.archetypeId)).size === pkgs.length;
}

function pickThreeArchetypes(received: string[]): string[] {
  const seen = new Set(received.filter((id) => archetypes.some((a) => a.id === id)));
  const ordered = archetypes.map((a) => a.id);
  const result: string[] = [...seen];
  for (const id of ordered) {
    if (result.length >= 3) break;
    if (!result.includes(id)) result.push(id);
  }
  return result.slice(0, 3);
}

function extractToolUse(message: Anthropic.Message): Anthropic.ToolUseBlock | null {
  return (
    message.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === "tool_use" && b.name === "present_packages",
    ) ?? null
  );
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      500,
      "The curation service isn't configured. ANTHROPIC_API_KEY is missing.",
    );
  }

  let answers: IntakeAnswers;
  try {
    answers = (await req.json()) as IntakeAnswers;
  } catch {
    return jsonError(400, "Couldn't read the brief.");
  }

  if (
    !answers?.herDescription ||
    !answers?.when ||
    !answers?.vibe ||
    !answers?.budget
  ) {
    return jsonError(400, "The brief is missing a few details.");
  }

  if (
    answers.herDescription.length > 2000 ||
    (answers.avoid?.length ?? 0) > 2000
  ) {
    return jsonError(400, "The brief is too long. Trim it back.");
  }
  if (answers.when.length > 200) {
    return jsonError(400, "The brief is too long. Trim it back.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = buildSystemPrompt(venues, archetypes);
  const userPrompt = buildUserPrompt(answers);

  let firstMessage: Anthropic.Message;
  try {
    firstMessage = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools: [presentPackagesTool],
      tool_choice: { type: "tool", name: "present_packages" },
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 429) return jsonError(429, "The service is busy. Try again in a moment.");
    if (status === 401 || status === 403) {
      return jsonError(500, "The curation service rejected its key.");
    }
    return jsonError(502, "The curation service didn't respond. Try again.");
  }

  const firstTool = extractToolUse(firstMessage);
  if (!firstTool) {
    return jsonError(502, "The response came back malformed.");
  }

  const firstRaw = (firstTool.input as { packages?: RawPackage[] }).packages ?? [];
  let packages = hydratePackages(firstRaw);

  if (packages.length === 3 && distinctArchetypeIds(packages)) {
    return NextResponse.json({ packages });
  }

  // Retry once with a corrective multi-turn message.
  const receivedIds = packages.map((p) => p.archetypeId);
  const neededIds = pickThreeArchetypes(receivedIds);
  const retryPrompt = buildRetryUserPrompt(receivedIds, neededIds);

  let retryMessage: Anthropic.Message;
  try {
    retryMessage = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools: [presentPackagesTool],
      tool_choice: { type: "tool", name: "present_packages" },
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: firstMessage.content },
        { role: "user", content: retryPrompt },
      ],
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 429) return jsonError(429, "The service is busy. Try again in a moment.");
    return jsonError(502, "The curation service didn't respond. Try again.");
  }

  const retryTool = extractToolUse(retryMessage);
  if (!retryTool) {
    return jsonError(502, "The response came back malformed.");
  }

  const retryRaw = (retryTool.input as { packages?: RawPackage[] }).packages ?? [];
  packages = hydratePackages(retryRaw);

  if (packages.length === 3 && distinctArchetypeIds(packages)) {
    return NextResponse.json({ packages });
  }

  console.warn(
    "[curate] retry failed: packages=%d archetypes=%o",
    packages.length,
    packages.map((p) => p.archetypeId),
  );
  return jsonError(502, "The response came back malformed. Try again.");
}
