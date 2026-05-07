import type { Package, StageKind } from "./types";

export function formatPriceEstimate(pe: Package["priceEstimate"]): string {
  const range = pe.low === pe.high ? `$${pe.low}` : `$${pe.low}–$${pe.high}`;
  return pe.perPerson ? `${range} per person` : range;
}

const STAGE_LABEL: Record<StageKind, string> = {
  cocktails: "Cocktails",
  dinner: "Dinner",
  nightcap: "Nightcap",
  coffee: "Coffee",
  brunch: "Brunch",
  walk: "Walk",
  cultural: "Cultural",
  activity: "Activity",
  water: "Water",
  browse: "Browse",
  show: "Show",
};

export function stageLabel(kind: StageKind): string {
  return STAGE_LABEL[kind];
}

export function formatShape(stages: { kind: StageKind }[]): string {
  return stages.map((s) => stageLabel(s.kind)).join(" – ");
}

export function formatStageOrder(order: number): string {
  return order < 10 ? `0${order}` : String(order);
}
