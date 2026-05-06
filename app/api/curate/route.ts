import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/encore-prompt";
import { experiences, restaurants } from "@/lib/seed-data";
import type { IntakeAnswers, Package } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

interface RawPackage {
  id: string;
  title: string;
  headline: string;
  restaurantId: string;
  experienceId?: string;
  narrative: string;
  dressCode: string;
  parking: string;
  conversationStarters: string[];
  dontBringUp: string;
  priceEstimate: string;
}

const presentPackagesTool: Anthropic.Tool = {
  name: "present_packages",
  description:
    "Present three Encore packages to the client. Always exactly three: The Classic, The Off-Note, The Big Swing.",
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
            "id",
            "title",
            "headline",
            "restaurantId",
            "narrative",
            "dressCode",
            "parking",
            "conversationStarters",
            "dontBringUp",
            "priceEstimate",
          ],
          properties: {
            id: {
              type: "string",
              enum: ["classic", "off-note", "big-swing"],
            },
            title: {
              type: "string",
              description: "One of: 'The Classic', 'The Off-Note', 'The Big Swing'",
            },
            headline: {
              type: "string",
              description: "One sentence positioning the package.",
            },
            restaurantId: {
              type: "string",
              description: "Must match an id from the restaurants list.",
              enum: restaurants.map((r) => r.id),
            },
            experienceId: {
              type: "string",
              description: "Optional. Must match an id from the experiences list.",
              enum: experiences.map((e) => e.id),
            },
            narrative: {
              type: "string",
              description: "3 to 5 sentences in Encore's voice.",
            },
            dressCode: { type: "string" },
            parking: { type: "string" },
            conversationStarters: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
            dontBringUp: { type: "string" },
            priceEstimate: {
              type: "string",
              description: "Per-person range, e.g. '$220 to $280 per person'.",
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

  if (answers.herDescription.length > 2000 || (answers.avoid?.length ?? 0) > 2000) {
    return jsonError(400, "The brief is too long. Trim it back.");
  }
  if (answers.when.length > 200) {
    return jsonError(400, "The brief is too long. Trim it back.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(restaurants, experiences),
      tools: [presentPackagesTool],
      tool_choice: { type: "tool", name: "present_packages" },
      messages: [{ role: "user", content: buildUserPrompt(answers) }],
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 429) {
      return jsonError(429, "The service is busy. Try again in a moment.");
    }
    if (status === 401 || status === 403) {
      return jsonError(500, "The curation service rejected its key.");
    }
    return jsonError(502, "The curation service didn't respond. Try again.");
  }

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse || toolUse.name !== "present_packages") {
    return jsonError(502, "The response came back malformed.");
  }

  const input = toolUse.input as { packages?: RawPackage[] };
  const raw = input?.packages;
  if (!Array.isArray(raw) || raw.length !== 3) {
    return jsonError(502, "Expected three packages, didn't get them.");
  }

  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));
  const experienceById = new Map(experiences.map((e) => [e.id, e]));

  const packages: Package[] = [];
  for (const r of raw) {
    const restaurant = restaurantById.get(r.restaurantId);
    if (!restaurant) {
      return jsonError(502, `Unknown restaurant: ${r.restaurantId}`);
    }
    const experience = r.experienceId
      ? experienceById.get(r.experienceId)
      : undefined;
    if (r.experienceId && !experience) {
      return jsonError(502, `Unknown experience: ${r.experienceId}`);
    }
    packages.push({
      id: r.id,
      title: r.title,
      headline: r.headline,
      restaurant,
      experience,
      narrative: r.narrative,
      dressCode: r.dressCode || restaurant.dressCode,
      parking: r.parking || restaurant.parking,
      conversationStarters: r.conversationStarters,
      dontBringUp: r.dontBringUp,
      priceEstimate: r.priceEstimate,
    });
  }

  return NextResponse.json({ packages });
}
