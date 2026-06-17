// frontend/src/three/palette.test.ts
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { PALETTE } from "./palette";

describe("PALETTE", () => {
  it("exposes every documented token as a parseable hex color", () => {
    const keys = [
      "STONE_DARK", "STONE_LIGHT", "GOLD", "GOLD_BRIGHT",
      "GEM", "GEM_BRIGHT", "RIBBON", "PARCHMENT", "LEATHER", "CANDLE_WARM",
    ] as const;
    for (const k of keys) {
      expect(PALETTE[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
      // throws if three cannot parse it
      expect(() => new THREE.Color(PALETTE[k])).not.toThrow();
    }
  });
});
