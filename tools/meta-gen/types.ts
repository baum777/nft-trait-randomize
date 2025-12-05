/**
 * Core types for the Surge Bulls & Void Bears NFT Metadata Generator
 */

export type TraitCategory = "CHAOS" | "THRESHOLD" | "ORDEAL_REWARD" | "MYTHIC";

export type Archetype = "Bull" | "Bear" | "Hybrid";

export interface TraitConfig {
  name: string;
  category: TraitCategory;
}

export interface LayerConfig {
  name: string;   // e.g. "Background"
  key: string;    // e.g. "background"
  traits: TraitConfig[];
}

export interface TierThreshold {
  tier: number;
  name: string;
  min: number;
  max: number;
}

export interface HeroStation {
  id: number;
  name: string;
}

export interface CollectionConfig {
  name: string;
  symbol: string;
  family: string;
  description_base: string;
  seller_fee_basis_points: number;
  image_cid: string;
  external_url: string;
  creator_address: string;
}

export interface ScoringConfig {
  categories: Record<TraitCategory, number>;
  tier_thresholds: TierThreshold[];
}

export interface HeroJourneyConfig {
  stations: HeroStation[];
}

export interface MetaGenConfig {
  collection: CollectionConfig;
  scoring: ScoringConfig;
  hero_journey: HeroJourneyConfig;
  layers: LayerConfig[];
}

export interface GeneratedTrait {
  layerKey: string;
  traitType: string;
  value: string;
  category: TraitCategory;
  score: number;
}

export interface GeneratedNft {
  id: number;
  station: HeroStation;
  archetype: Archetype;
  traits: GeneratedTrait[];
  totalScore: number;
  tier: TierThreshold;
  inscriptionTag: string;
  mintTimestamp: number;
}

export interface NftBlueprint {
  id: number;
  station: HeroStation;
  archetype: Archetype;
}

export interface MetaplexAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  category?: TraitCategory;
  score?: number;
}

export interface MetaplexCreator {
  address: string;
  share: number;
}

export interface MetaplexCollection {
  name: string;
  family: string;
}

export interface MetaplexProperties {
  category: string;
  files: Array<{ uri: string; type: string }>;
  creators: MetaplexCreator[];
}

export interface MetaplexMetadata {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  collection: MetaplexCollection;
  attributes: MetaplexAttribute[];
  properties: MetaplexProperties;
}
