export type PokemonStats = {
  hp: number;
  attack: number;
  defense: number;
  "special-attack": number;
  "special-defense": number;
  speed: number;
};

export type PokemonSpecies = {
  generation: string;
  description: string;
  genus: string;
  color: string;
  shape: string;
  habitat: string | null;
  is_legendary: boolean;
  is_mythical: boolean;
  evolution_chain_id: number;
};

export type PokemonImages = {
  sprite: string;
  official_artwork: string;
};

export type Pokemon = {
  id: number;
  name: string;
  height_decimetres: number;
  weight_hectograms: number;
  base_experience: number;
  types: string[];
  stats: PokemonStats;
  abilities: string[];
  moves: string[];
  species: PokemonSpecies;
  images: PokemonImages;
};

export type Pokedex = {
  metadata: {
    schema_version: number;
    source: string;
    scope: string;
    version_groups: string[];
  };
  pokemon: Pokemon[];
};