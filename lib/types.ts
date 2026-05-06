export type PriceTier = "$$" | "$$$" | "$$$$";

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
  | "foodie";

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  priceTier: PriceTier;
  vibe: VibeTag[];
  blurb: string;
  bestFor: string;
  dressCode: string;
  parking: string;
  reservationNote?: string;
}

export interface Experience {
  id: string;
  name: string;
  type: "cruise" | "museum" | "walk" | "gallery" | "cocktails" | "show";
  priceTier: PriceTier;
  vibe: VibeTag[];
  blurb: string;
  bestFor: string;
  duration: string;
  pairsWellWith: string;
  logistics: string;
}

export interface Package {
  id: string;
  title: string;
  headline: string;
  restaurant: Restaurant;
  experience?: Experience;
  narrative: string;
  dressCode: string;
  parking: string;
  conversationStarters: string[];
  dontBringUp: string;
  priceEstimate: string;
}

export interface IntakeAnswers {
  herDescription: string;
  when: string;
  vibe: "relaxed" | "special" | "adventurous" | "classic";
  budget: "comfortable" | "elevated" | "no-ceiling";
  avoid?: string;
}
