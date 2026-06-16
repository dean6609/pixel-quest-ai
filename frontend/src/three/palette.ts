// frontend/src/three/palette.ts

/**
 * Single source of truth for the grimoire scene's warm + purple palette.
 * Candles stay warm amber; walls, gem, and accents go violet + gold.
 * Tune values here — every scene component reads from this object.
 */
export const PALETTE = {
  STONE_DARK: "#241b30",   // wall base, violet-tinted stone
  STONE_LIGHT: "#2e2240",  // wall highlight / arch face
  GOLD: "#d4a23a",         // book ornament, accents
  GOLD_BRIGHT: "#f0c060",  // gold highlights that catch the bloom
  GEM: "#c64bff",          // grimoire gem + crystals (emissive)
  GEM_BRIGHT: "#e879ff",   // gem core / glow color
  RIBBON: "#5b3a8c",       // page bookmark ribbon
  PARCHMENT: "#e8dcc0",    // open-book page surface
  LEATHER: "#5a1d22",      // grimoire cover leather
  CANDLE_WARM: "#ffb053",  // candle light (matches existing Candles.tsx)
} as const;

export type PaletteToken = keyof typeof PALETTE;
