# Plan: Stone Tools + Water/Clay Jar Gate + Dugout Canoe

## Summary

Add the stone tool chain, water resource (clay jars only), and dugout canoe. Water costs apply **only to dugout-tier expeditions**, making clay jars the gate for the next exploration tier.

Progression: stone tools → shell adze + stone axe → dugout canoe → dugout expeditions require water → clay jars essential.

---

## Step 1: New Resources

Add to `types.ts` ResourceId and `resources.ts`:

| Resource | Category | Notes |
|---|---|---|
| `chert` | raw | Knappable beach stone |
| `stone_flake` | processed | Basic knapping output |
| `stone_blade` | processed | Refined knapping output |
| `hammerstone` | tool | Required for knapping |
| `shell_adze` | tool | Scraping/shaping tool, needs large_shell |
| `stone_axe` | tool | Phase gate — unlocks tree felling |
| `large_log` | raw, size: large | From felling trees, used for dugout |
| `dugout` | structure, size: large | Vessel — near-shore expeditions |
| `fresh_water` | food | Water resource (category "food" so it uses same storage bonuses, or maybe new category?) |

**Design decision on fresh_water category:** Use `"food"` category — it's expedition fuel just like food, stored the same way. The deduction system will need a parallel `waterCost` field on expeditions (separate from foodCost). Alternatively, make it a new `"water"` resource category. Let's keep it simple: `category: "food"` but with a separate water deduction system.

Actually, cleaner approach: **fresh_water is category "processed"** (it's stored in clay jars). Expeditions get a new `waterCost` field. Water deduction works like food deduction but only draws from water resources.

---

## Step 2: Stone Tool Recipes

Add to `recipes.ts`:

| Recipe | Skill | Level | Inputs | Output | Notes |
|---|---|---|---|---|---|
| Craft Hammerstone | Crafting | 5 | flat_stone ×2 | hammerstone ×1 | One-time, tool for knapping |
| Strike Stone Flake | Crafting | 5 | chert ×1 | stone_flake ×2 | Repeatable, requires hammerstone |
| Knap Stone Blade | Crafting | 8 | stone_flake ×2 | stone_blade ×1 | Repeatable, requires hammerstone |
| Shell Adze | Crafting | 8 | large_shell ×1, cordage ×2, driftwood_branch ×1 | shell_adze ×1 | One-time tool |
| Stone Axe | Crafting | 14 | stone_blade ×2, driftwood_branch ×2, cordage ×3 | stone_axe ×1 | One-time, PHASE GATE |

---

## Step 3: New Actions

Add to `actions.ts`:

| Action | Skill | Level | Biome | Drops | Notes |
|---|---|---|---|---|---|
| Collect Beach Chert | Foraging | 5 | beach | chert ×1 (50% chance) | Mid-game stone source |
| Fell Large Tree | Woodworking | 15 | jungle_interior | large_log ×1 | Requires stone_axe tool, long duration (15s) |
| Collect Fresh Water | Foraging | 1 | jungle_interior | fresh_water ×1 | Stream water, stored in clay jars (requires fired_clay_pot or sealed_clay_jar) |

For Collect Fresh Water: require `fired_clay_pot` as a tool (you need a container). This makes fired clay pots useful even before sealed jars.

---

## Step 4: Water System

In `gameState.ts`:
- Add `WATER_VALUES` array (like `FOOD_VALUES`): `fresh_water` with value 1
- Add `getTotalWater()`, `deductWater()` functions (mirror food system)

In `types.ts`:
- Add `waterCost?: number` to `ExpeditionDef`

In `tick.ts`:
- When starting/continuing expeditions, check and deduct water alongside food

In `useGame.ts`:
- Check water availability when starting expeditions with waterCost

---

## Step 5: Dugout Canoe

Multi-step build — simplified from the 4-step design doc version to work within the current recipe system. Each step is a separate recipe that produces an intermediate, culminating in the dugout.

| Recipe | Skill | Level | Inputs | Output | Buildings | Notes |
|---|---|---|---|---|---|---|
| Char Log Interior | Woodworking | 16 | large_log ×1, dry_grass ×2, driftwood_branch ×2 | charred_log ×1 | camp_fire | Burn out the interior |
| Scrape Hull | Woodworking | 17 | charred_log ×1 | shaped_hull ×1 | — | Requires shell_adze tool |
| Assemble Dugout | Construction | 18 | shaped_hull ×1, cordage ×6, bamboo_cane ×4 | dugout ×1 | — | One-time, vessel |

New intermediate resources: `charred_log` (raw, large), `shaped_hull` (processed, large).

---

## Step 6: Dugout Expedition

Add new expedition to `expeditions.ts`:

**Explore Island Reef** (dugout required)
- Food cost: 5, Water cost: 3
- Duration: 20s
- Nav XP: 40
- Outcomes: discover `island_reef` biome, find coral, sea urchin, new fish species, or nothing

New biome: `island_reef`
New resources (simple for now): `coral` (raw), `sea_urchin` (food)

Also update the nearby island expedition: when player has dugout, it could be faster or have better drops (but keeping it simple — the dugout just unlocks the reef expedition).

---

## Step 7: Update Existing Expedition Costs

Update `sail_nearby_island` expedition: add `waterCost: 2` **only when requiring dugout** — actually, the current design is that raft expeditions don't need water. So keep `sail_nearby_island` as food-only (raft tier).

The new `explore_island_reef` (dugout tier) gets both food + water costs.

---

## Files to Modify

1. **`src/data/types.ts`** — New ResourceIds, BiomeId `island_reef`, `waterCost` on ExpeditionDef
2. **`src/data/resources.ts`** — New resource definitions
3. **`src/data/recipes.ts`** — Stone tool recipes, dugout build chain
4. **`src/data/actions.ts`** — Chert gathering, tree felling, water collection
5. **`src/data/expeditions.ts`** — Island reef expedition
6. **`src/data/buildings.ts`** — No new buildings needed (existing firing pit/kiln suffice)
7. **`src/engine/gameState.ts`** — Water values, deduction functions
8. **`src/engine/tick.ts`** — Water cost deduction in expedition loop
9. **`src/engine/useGame.ts`** — Water check when starting expeditions, expose water total
10. **`src/data/milestones.ts`** — Optional: crafting milestones for knapping speed

## Build Order

1. Types + resources (foundation)
2. Recipes (stone tools + dugout chain)
3. Actions (chert, tree felling, water collection)
4. Water system (gameState + tick + useGame)
5. Expedition (island reef with water cost)
6. Build & test
