# SeaBound Development Diary

---

## Session 1 — Tropical Island Reboot (2026-03-16)

### What We Did

Completely rewrote the game data layer and engine to match the new tropical island progression design (seabound-progression-v2.md). The old codebase had a generic survival theme (woodcutting, mining, berries, mushrooms, stone axes). Now it's a tropical island castaway game.

**Changes made:**

1. **types.ts** — New `ResourceId` union with ~27 tropical resources (coconut, bamboo, shells, vine, coral...), new `SkillId` set (9 skills matching the design doc), added `BiomeId`, `ExpeditionDef`, `ExpeditionOutcome` types, added `discoveredBiomes` to `GameState`, added expedition action type.

2. **skills.ts** — Replaced 6 old skills (woodcutting, mining, foraging, crafting, firemaking, exploration) with 9 design-doc skills: Foraging, Fishing, Woodworking, Crafting, Weaving, Construction, Farming, Navigation, Preservation. XP formula unchanged.

3. **resources.ts** — Completely replaced. 27 resources across Phase 0 (beach), Phase 1 (bamboo tier), Phase 1b (fire), and cooked food. Every resource has name, description, category.

4. **actions.ts** — Phase 0: 7 gathering actions (gather coconuts, collect driftwood, beach stones, vines, palm fronds, dry tinder, wade tidal pools). Phase 1: 3 bamboo/fiber actions (harvest bamboo, strip green bamboo, strip fibrous bark). Phase 2 fishing: spear fish. Biome-gated and tool-gated properly.

5. **recipes.ts** — 12 recipes covering the full Phase 1 crafting chain: split bamboo, bamboo knife, shell scraper, rough cordage, dried fiber, cordage, bow drill kit, bamboo spear, digging stick, cook fish, cook crab. Item-trigger gates (e.g. bamboo spear requires bow_drill_kit in inventory).

6. **expeditions.ts** — New file. "Scout the Island" expedition with weighted RNG outcomes: 35% bamboo grove discovery, 25% stones, 20% vines, 20% nothing. Biome discoveries are permanent and filter out from future rolls.

7. **gameState.ts** — Added `discoveredBiomes: ["beach"]` to initial state, save migration for old saves, all 9 skills initialized.

8. **tick.ts** — Added expedition completion handling, weighted outcome picker that filters already-discovered biomes, navigation XP on expedition completion.

9. **useGame.ts** — Added `startExpedition`, biome-gated action filtering, item-trigger recipe filtering, expedition progress tracking, expedition food refund on cancel.

10. **UI** — New `ExpeditionPanel.tsx` showing discovered biomes and available expeditions. Updated `ActionPanel.tsx` skill order. Updated `App.tsx` with 5 tabs (Gather, Craft, Explore, Skills, Log). Tropical color theme (dark teal/amber).

### What Works

- Full Phase 0 gameplay loop: forage on the beach, fish tidal pools, collect materials
- Expedition system: scout the island to discover bamboo grove (RNG, repeatable)
- Phase 1 unlocks properly when bamboo grove is found (new actions appear)
- Crafting chain: bamboo cane -> splinters -> knife, fiber -> cordage, bow drill -> fire-hardened tools
- Item-trigger gates: cooking and fire-hardened tools require bow drill kit in inventory
- Biome-gated actions: bamboo harvesting only available after grove discovery
- Offline progress works for all action types
- Save/load with migration from old format
- Build passes clean (tsc + vite, zero errors)

### What's Missing / Next Steps

- **Settlement buildings** — Camp Fire should be a building, not just a tool. Need a buildings/settlement system (Palm Leaf Pile, Woven Basket storage, Drying Rack, etc.)
- **Shell adze** — Design doc mentions it but we need `large_shell` drops and the recipe
- **Farming** — Cleared plots, planting, semi-idle set-and-claim loop
- **Phase 2 fishing tiers** — Drop line (Fishing 8), basket trap (Fishing 10 + Weaving 15)
- **Jungle interior expedition** — Food/water costs, basalt/clay/crop discoveries
- **Stone tools chain** — Knapping: chert -> flakes -> blades -> points
- **Drying rack** — Semi-idle processing station for fiber, fish, hides
- **Navigation skill effects** — Should improve expedition discovery odds (currently flat)
- **Weaving skill actions** — No weaving actions yet (mats, baskets)
- **Construction skill** — No construction actions yet
- **Coconut water** — Design mentions using coconuts for water collection; no water resource yet
- **Action speed scaling** — Higher skill levels should reduce action duration
- **More expedition variety** — Currently only "Scout the Island"
- **Offline progress cap** — Could accumulate absurd amounts if away for days
- **Resource display** — Could group by category (raw/processed/tool/food)
- **Mobile UX** — Touch targets, swipe between tabs

### What Didn't Work / Design Decisions

- **Smithing skill** — Defined in the design doc but intentionally left out of initial skills since it's late game. Will add when metal content exists.
- **Semi-idle traps/farms** — The set-and-claim model needs a new action type beyond gather/craft/expedition. Deferred to next session.
- **Camp fire as building vs tool** — Design doc says fire is a settlement building that persists. For now, the bow drill kit acts as the "have fire" flag. Proper building system needed.
- **Drop amounts** — Design doc says "coconut x1-2" (variable drops). Current system uses fixed amounts with chance-based bonus drops. Could add min/max ranges later.

---
