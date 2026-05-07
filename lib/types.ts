export type PriceTier = "$$" | "$$$" | "$$$$";

export type VenueCategory =
  | "restaurant"
  | "bar"
  | "cafe"
  | "museum"
  | "gallery"
  | "garden"
  | "walk"
  | "water"
  | "bookstore"
  | "sport"
  | "venue";

export type VibeTag =
  | "classic"
  | "lively"
  | "intimate"
  | "waterfront"
  | "romantic"
  | "modern"
  | "old-world"
  | "sceney"
  | "quiet"
  | "jazz"
  | "coastal"
  | "foodie"
  | "cultural"
  | "outdoor"
  | "active"
  | "contemplative"
  | "literary";

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  neighborhood: string;
  priceTier: PriceTier;
  vibe: VibeTag[];
  blurb: string;
  bestFor: string;
  dressCode?: string;
  parking?: string;
  reservationNote?: string;
  typicalDuration: string;
}

export type StageKind =
  | "cocktails"
  | "dinner"
  | "nightcap"
  | "coffee"
  | "brunch"
  | "walk"
  | "cultural"
  | "activity"
  | "water"
  | "browse"
  | "show";

export interface PackageStage {
  order: number;
  kind: StageKind;
  venueId: string;
  venue: Venue;
  timeOfEvening: string;
  why: string;
  transition?: string;
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
  shape: StageKind[];
  signal: string;
  bestFor: string;
  intensity: "low" | "medium" | "high";
  timeOfDay: "morning" | "daytime" | "evening" | "flexible";
}

export interface Package {
  id: string;
  archetypeId: string;
  archetypeName: string;
  headline: string;
  signal: string;
  stages: PackageStage[];
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

export interface IntakeAnswers {
  herDescription: string;
  when: string;
  vibe: "relaxed" | "special" | "adventurous" | "classic";
  budget: "comfortable" | "elevated" | "no-ceiling";
  avoid?: string;
}
