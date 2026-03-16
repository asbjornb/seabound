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

## Session 2 — Settlement Buildings System (2026-03-16)

### What We Did

Implemented the settlement buildings system — the first item on the "next steps" list from Session 1. Buildings are permanent structures that persist and act as unlock gates for recipes and actions, replacing the old `bow_drill_kit` item-trigger pattern for fire-dependent content.

**Changes made:**

1. **types.ts** — Added `BuildingId` type (`camp_fire`, `palm_leaf_pile`, `drying_rack`), `BuildingDef` interface, added `buildings: BuildingId[]` to `GameState`, added `requiredBuildings` to both `ActionDef` and `RecipeDef`, added `buildingOutput` to `RecipeDef` for recipes that construct buildings.

2. **buildings.ts** — New file. Three initial building definitions with names, descriptions, and unlock descriptions: Camp Fire (cooking, fire-hardening), Palm Leaf Pile (basic storage), Drying Rack (fiber/fish/hide drying).

3. **recipes.ts** — Three new building construction recipes:
   - **Light Camp Fire** (Crafting 2): bow_drill_kit + tinder + driftwood → Camp Fire building
   - **Palm Leaf Pile** (Construction 1): palm_fronds + driftwood → basic storage building
   - **Drying Rack** (Crafting 5): bamboo + cordage → processing station
   - Migrated fire-dependent recipes (bamboo spear, digging stick, cook fish, cook crab) from `requiredItems: ["bow_drill_kit"]` to `requiredBuildings: ["camp_fire"]`

4. **gameState.ts** — Added `buildings: []` to initial state. Save migration: auto-grants `camp_fire` building to players who already have a `bow_drill_kit` in inventory (prevents breaking existing saves).

5. **tick.ts** — `applyCraftCompletion` now checks for `buildingOutput` — if set, adds the building ID to `state.buildings` instead of producing a resource output.

6. **useGame.ts** — Recipe and action filtering now checks `requiredBuildings` gate. Building recipes for already-built buildings are hidden from the available list.

7. **SettlementPanel.tsx** — New component. Shows built buildings (green accent border, name, description, what it unlocks) and available building construction recipes (same card UI as crafting with resource requirements).

8. **App.tsx** — Added "Camp" tab (6 tabs total: Gather, Craft, Camp, Explore, Skills, Log). Recipes are split: building recipes go to Camp tab, regular recipes stay in Craft.

9. **App.css** — New styles for `.building-list`, `.building-card`, `.building-name`, `.building-desc`, `.building-unlocks` with green accent for built buildings.

### What Works

- Full building construction flow: gather materials → go to Camp tab → build
- Camp Fire properly gates cooking and fire-hardened tools (replaces old bow_drill_kit item-trigger)
- Palm Leaf Pile buildable early with just beach resources
- Drying Rack requires mid-game resources (bamboo + cordage, Crafting 5)
- Buildings persist in save and display in the Camp tab
- Already-built building recipes disappear from the list
- Save migration handles old saves gracefully (auto-grants camp_fire if player had bow_drill_kit)
- Build passes clean (tsc + vite, zero errors)

### What's Missing / Next Steps

- **More buildings** — Stone Hearth (Construction 10), Woven Basket storage (Weaving 5), Smoking Rack (Crafting 8 + hearth), Workbench (Crafting 15)
- **Building effects** — Buildings should mechanically affect gameplay (e.g. storage buildings increase resource cap, drying rack enables better fiber drying recipe)
- **Shell adze** — Design doc mentions it but we need `large_shell` drops and the recipe
- **Farming** — Cleared plots as buildings, planting, semi-idle set-and-claim loop
- **Phase 2 fishing tiers** — Drop line (Fishing 8), basket trap (Fishing 10 + Weaving 15)
- **Jungle interior expedition** — Food/water costs, basalt/clay/crop discoveries
- **Stone tools chain** — Knapping: chert → flakes → blades → points
- **Navigation skill effects** — Should improve expedition discovery odds
- **Weaving skill actions** — Mats, baskets, traps
- **Action speed scaling** — Higher skill levels should reduce action duration
- **Building upgrade chains** — Camp Fire → Stone Hearth → Cooking Hearth

### Design Decisions

- **Buildings as RecipeDef with buildingOutput** — Rather than creating a whole new action system, buildings are crafted via the existing recipe system with a `buildingOutput` field. This keeps the engine simple and reuses all existing crafting logic (resource deduction, progress bar, XP award, completion handling).
- **Separate Camp tab** — Building recipes could live in the Craft tab, but a dedicated Camp tab gives the settlement its own identity and keeps Craft focused on tools and consumables.
- **requiredBuildings vs requiredItems** — Created a parallel gating system specifically for buildings rather than overloading the item-trigger system. This is cleaner because buildings aren't consumed and don't sit in the resource inventory.
- **Placeholder output for building recipes** — Building recipes still need the `output` field to satisfy the RecipeDef type, but it's set to `amount: 0` and ignored when `buildingOutput` is present. Could make output optional later but this avoids a larger refactor.

---

## Session 3 — Action Switching & Expedition Costs (2026-03-16)

### What We Did

Two quality-of-life improvements that change how the game feels to play.

**PR #6 — Allow action switching:**
- Starting a new action now cancels the current one instead of blocking all buttons while busy
- Resources from cancelled crafts/expeditions are refunded automatically via a shared `refundCurrentAction` helper
- Removed the global "busy" disable from all panels (ActionPanel, CraftingPanel, ExpeditionPanel, SettlementPanel)

**PR #7 — Expedition food costs and auto-repeat:**
- Expeditions now auto-repeat like gather actions — keep scouting until food runs out
- Scout the Island costs 1 coconut per trip, making coconut gathering a meaningful early progression goal
- `ExpeditionDef` gained `skillId` and `xpGain` fields for consistency with other action types
- UI disables expeditions when food is insufficient, highlights missing resources in red

### What Works

- Fluid action switching — tap any action to start it, previous action cancels with full refund
- Expeditions feel integrated with the gather loop instead of being a separate one-shot mechanic
- Coconut as expedition fuel creates a natural early-game economy: forage coconuts → scout → discover bamboo grove

### Design Decisions

- **Cancel-and-refund over queue** — Could have implemented an action queue, but cancel-and-refund is simpler and fits the idle game feel. Players should always be able to switch tasks instantly.
- **Coconut cost for scouting** — Makes the early game less trivial. Players must balance eating coconuts (future cooking) vs spending them on exploration. Creates a real decision point.

---

## Session 4 — Early Game Progression Rework (2026-03-16)

### What We Did

Major rework of the first few minutes of gameplay to create a smoother onboarding curve and a satisfying early loop (PR #8, 4 commits).

**Changes made:**

1. **Tidal pool food loop** — Tidal pool wading now reliably drops food (small fish, crab) to establish an immediate gather→eat→explore loop. Players can feed themselves from the start.

2. **Coconut grove as milestone** — Coconut gathering moved behind a discoverable "coconut grove" biome (found via early scouting), making it a progression reward instead of an always-available action. The first expedition now has two possible discovers: coconut grove and bamboo grove.

3. **Gradual action unlocks** — Not all beach actions are available from the start anymore. Palm frond collection unlocks at Foraging 2, vine collection and driftwood stay available. This prevents overwhelming new players with too many options.

4. **Lowered coconut grove discovery chance** — Tuned RNG so coconut grove isn't found immediately; bamboo grove chance also adjusted. Multiple scout trips expected.

5. **Skill milestone system** — New `milestones.ts` file. Two types of milestones:
   - **Authored milestones** with mechanical effects (e.g. Fishing 2/3: +2% fish and crab chance from tidal pools)
   - **Auto-generated milestones** from action/recipe skill requirements (e.g. "Unlock action: Strip Fibrous Bark" at the required level)
   - `getDropChanceBonus()` and `getDurationMultiplier()` functions apply milestone effects to the game engine
   - Skills panel shows upcoming milestones so players can see what to work toward

6. **UI improvements** — Skills panel now shows milestone progress. Expedition panel simplified.

### What Works

- First minutes feel much better: wade tidal pools → get food → scout island → discover coconut grove → gather coconuts → scout more → discover bamboo grove
- Skill milestones give visible goals ("2 more levels until I unlock X")
- Drop chance bonuses from milestones make leveling feel rewarding
- Gradual action unlocks prevent early-game overwhelm

### What's Missing / Next Steps

- **More authored milestones** — Only Fishing has hand-crafted milestones so far; other skills need them
- **Storage caps** — No limit on resources yet; storage buildings have no mechanical purpose
- **Building effects** — Buildings should grant bonuses, not just gate recipes
- **Shell adze** — Still missing
- **Farming, fishing tiers, stone tools** — Still on the roadmap

### Design Decisions

- **Coconut grove as discovery** — Coconuts being always available made the early game too easy and exploration pointless. Gating them behind a biome discovery creates a "first win" moment.
- **Milestone system architecture** — Authored milestones with effects + auto-generated unlock previews. This lets us hand-tune important progression beats while automatically showing every skill-gated unlock without manual maintenance.
- **Drop chance bonuses over flat yields** — Milestones boost drop *chances* rather than giving flat resource increases. This feels more natural and keeps the RNG element that makes gathering interesting.

---

## Session 5 — Inventory Limits & Storage Building Effects (2026-03-16)

### What We Did

Added per-item storage caps to make storage buildings mechanically meaningful (PR #10).

**Changes made:**

1. **Per-item storage cap** — Default cap of 10 per resource. Resources at cap show a yellow warning in the UI. Items over cap (from old saves) are kept but can't gain more until consumed below the limit.

2. **Building storage bonuses** — Buildings now grant category-based storage increases:
   - Palm Leaf Pile: +20 raw material capacity
   - Drying Rack: +20 processed material capacity
   - Camp Fire: +10 food capacity
   - `StorageBonus` type added to `BuildingDef`

3. **`getStorageCap()` function** — Computes effective cap per resource by checking category and summing bonuses from all constructed buildings.

4. **UI feedback** — Resources at or near cap show yellow styling. Settlement panel displays storage bonuses granted by each building.

### What Works

- Storage caps create real pressure to build storage buildings early
- Palm Leaf Pile (buildable with just beach resources) is now a meaningful early priority
- Players who ignore buildings hit the cap quickly and feel the need to invest in infrastructure
- Old save migration works cleanly — excess items preserved but capped going forward

### Design Decisions

- **Per-item cap, not total inventory** — Per-item caps are simpler to reason about and avoid the "inventory Tetris" problem. Each resource has its own limit.
- **Category-based bonuses** — Buildings boost whole categories (raw, processed, food) rather than specific items. This keeps the building system clean and avoids needing a building for every resource.
- **Default 10 cap** — Low enough to be felt quickly, high enough that you don't hit it every few seconds. Forces engagement with the building system within the first few minutes.

---
