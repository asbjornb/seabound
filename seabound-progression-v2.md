# SeaBound — Progression Design Document v2

---

## IMPLEMENTATION STATUS

*Last updated: 2026-04-29*

### What's Built

#### Island Arc — Phases 0–5

- **Phase 0 — Bare Hands** — Beach gathering: coconuts, driftwood, palm fronds, tidal pool wading, comb rocky shore (chert + flat stones), collect dry grass. Drainage trench action (Construction XP, requires large shell). Beach exploration expedition discovers coconut grove and rocky shore (rocky shore requires coconut grove first).
- **Phase 1 — Bamboo** — Triggered by discovering bamboo grove. Bamboo harvesting, splitting, coconut husk fiber/cordage chain, bamboo knife, bow drill kit, bamboo spear, digging stick. Discovery-driven; no skill level gates on core progression.
- **Phase 1b — Fire** — Camp Fire as a settlement building. Gates cooking, fire-hardened tools, char log step.
- **Phase 2 — Stone & Clay** — Triggered by acquiring fired clay pot. Stone tool chain (hammerstone → flake → blade → axe), shell adze, full pottery chain (shaped → fired → sealed jar → crucible), Firing Pit and Kiln buildings.
- **Phase 3 — Maritime** — Triggered by building the dugout canoe. Bamboo raft (early water access) and dugout canoe (4-step build: fell large tree → char log → scrape hull with shell adze → assemble) unlock new expeditions.
- **Phase 4 — Voyage** — Triggered by building the outrigger canoe (dugout + woven sail + bamboo battens + rigging). Unlocks the **Oceanic Voyage** expedition — the victory condition that ends the island arc.

#### Mainland Arc (post-victory, experimental)

After winning the Oceanic Voyage, players can opt into the mainland sandbox via a confirmation modal on the victory screen. Mainland adds three new skills (Combat, Mining, Smithing), two new biomes (Coastal Cliffs, Inland Hills), and a fully-built post-game loop. See **TAB 9: MAINLAND** below for the full design.

- **Mining** — Three actions: prospect copper vein (Coastal Cliffs), prospect tin deposit (Coastal Cliffs, Mining 5), mine iron ore (Inland Hills, Mining 10). Iron pickaxe / steel pickaxe speed bonuses.
- **Smithing chain** — Smelt copper (crucible + kiln), smelt tin, alloy bronze (Cu + Sn), smelt iron bloom (bloomery + bellows), hammer bloom on stone anvil → iron ingot, forge steel (iron + 8 charcoal in sealed crucible).
- **Equipment & combat** — Round-based simulated combat per expedition, Monte Carlo win-rate previews, equipment in 7 slots (weapon, offhand, head, body, legs, feet, trinket), 4 gear tiers, item conditions (broken/damaged/worn/pristine), affixes, repair, salvage, and one-shot imbuement with 7 rare reagents (one per mainland expedition).
- **7 mainland expeditions** — Coastal Ruins, Tidal Caves, Overgrown Trail, Flooded Quarry, Ridge Pass, Sunken Temple, Volcanic Rift. Each has 3 combat stages, typed damage, equipment drops (often broken), unique chase rewards, and an exclusive imbuement reagent.
- **Cartographer's Table** — Non-combat path to discover mainland mining biomes via slow charting sessions (Chart Coastal Regions, Chart Inland Territory). Also gives a 10% expedition speed bonus to Navigation expeditions.

#### Cross-cutting Systems

- **12 skills** — Foraging, Fishing, Woodworking, Crafting, Cooking, Weaving, Construction, Farming, Navigation, **Combat**, **Mining**, **Smithing**.
- **8 biomes** — Beach, Coconut Grove, Rocky Shore, Bamboo Grove, Jungle Interior, Nearby Island, Coastal Cliffs (mainland), Inland Hills (mainland). Biome discovery shows a banner image + flavor text modal.
- **Skill milestone system** — Hand-authored milestones across all skills with effects: action speed, drop chance bonuses, double-output chances, combat stat bonuses (offense/defense/life/attackSpeed/critChance/critMultiplier), and reduced setup costs. Auto-generated unlock previews are shown alongside.
- **Routines** — Unlocked when any skill reaches level 15. Chain 2+ actions into a repeating sequence. Building upgrades expand the system: Charcoal Board (+1 routine slot), Storage Shelf (+1 step + step-completion counts), Outrigger Canoe (+2 steps).
- **Action queue** — Multi-step queue for one-time crafts and gathers. Clay Tablet building grants +1 queue slot.
- **Stations (12)** — Passive set-wait-collect: Basket Trap, Tidal Weir (Fishing 11, requires Stone Tidal Weir building), 5 farming stations (Plant Wild Seeds, Cultivate Taro, Grow Bananas, Grow Pandanus, Grow Breadfruit), Burn Charcoal (Charcoal Kiln), Soak Pandanus (Soaking Pit), Harvest Pandanus Grove, Chart Coastal Regions, Chart Inland Territory.
- **Pandanus fiber chain** — Mid-game fiber path: pandanus cuttings (from dugout voyage) → grove or farm plot → leaves → dry / soak → strips → pandanus cordage / rope → sail. Sail unlocks the outrigger canoe.
- **Charcoal as fuel** — Charcoal Kiln converts large logs (3 → 15 charcoal). Charcoal substitutes for driftwood in most fire-based recipes.
- **29 buildings** — Camp Fire, Stone Hearth, Palm Leaf Pile, Drying Rack, Fenced Perimeter, Firing Pit, Kiln, Pottery Wheel, Charcoal Kiln, Fiber Loom, Weaving Frame, Soaking Pit, Woven Basket (×20), Raft, Dugout, Outrigger Canoe, Cleared Plot, Tended Garden, Farm Plot, Pandanus Grove, Well, Sleeping Mat, Hammock, Thatched Hut, Log Rack, Clay Storage Jar (×5), Storage Shelf, Clay Tablet, Charcoal Board, Rock Pool Cache, Stone Tidal Weir, Cartographer's Table (mainland), Bloomery (mainland).
- **Morale system** — Decay over active play, slowed by comfort buildings (mat/hammock/thatched hut). Shell Beads and Maintain Camp recipes restore morale. Low morale slows actions; high morale provides up to a 30% speed boost (diminishing returns).
- **Inventory caps & storage bonuses** — Per-item cap with bonuses from buildings, tagged by category (food, dried, large, charcoal, pandanus, tidal, etc.). Stash collapses when inventory exceeds 15 items.
- **Voyage Provisions** — Pack 5 food + sealed clay jar → voyage provisions. Efficient expedition fuel; required for the Oceanic Voyage.
- **Fresh water** — Fill Water Pot recipe at the Well (Construction-gated). Used as expedition fuel. Fired clay pots and fresh water share a combined storage cap.
- **Discovery-driven progression** — Core progression gated by biome discovery and crafting chains. Skill levels gate optional efficiency improvements. Gather panel grouped by biome.
- **Phase tracking** — Phase chips at the top of the screen reflect the player's current arc. Chapter banner images for each phase.
- **Search panel** — Global search across actions, recipes, stations, expeditions by name/inputs/outputs with quick-start buttons.
- **Mod system** — Full game data exportable as a `.zip` data pack (data.json + icons/). Validation on import. Activate / deactivate / delete mods from the Mods panel; each mod gets its own save namespace.
- **Offline progress** — All action types (gather, craft, station, expedition) progress while away.
- **Save/load** — Versioned migrations. Mainland progress is gated by `mainlandUnlocked` and tracked separately so it can be reset without affecting island progression.
- **Analytics** — Cloudflare Worker → R2 pipeline. Events: session_start, session_end, heartbeat (every 5 min), milestone. View funnel/drop-off via `?dev` panel.
- **Update banner** — PWA service worker; banner prompts users to refresh when a new build is available.

### What's Next

- More authored skill milestones (especially Mining, Smithing, Construction, Weaving)
- Stone Hearth → Cooking Hearth tier (smoking, preserved food)
- Smoking Rack, Workbench, Bone Station buildings
- Net fishing (Fishing 40 + Weaving 35) as a higher-tier alternative to the basket trap and stone weir
- Distant archipelago expeditions (rarer affix pools, deeper imbuement system)
- More uniques and limited imbuement variants
- Magic / supernatural systems (currently hinted at via mainland flavor)
- Automation for late-game stations

### Design Ideas (Not Yet Planned)

- **Resource obsolescence** — As players progress, early-phase resources (e.g. rough_fiber, flat stones) should become obsolete. Unlike Unnamed Space Idle's approach of making early resources infinite, we want a thematic solution. Possible approaches: auto-conversion (rough fiber → fiber when you unlock it), removal of obsolete actions/recipes from the UI once superseded, or a "mastery" mechanic where reaching a skill threshold trivializes early resources. Goal: reduce inventory clutter and action list bloat in late game without breaking the castaway theme.
- **Salvage reagent yields** — `affixReagentOutputs` is wired through the type system but the table is currently empty. Open question: should salvage be a meaningful path to imbuement reagents, or should reagents stay strictly expedition-locked?

---

## TAB 1: DESIGN PRINCIPLES

### Progression Philosophy

**Discovery and crafting drive progress. Skill levels drive efficiency.**
The core progression — reaching new areas, crafting new tools, building new structures — is gated by *finding things* and *making things*, not by reaching arbitrary skill levels. Skill levels should gate optional improvements: better yields, faster actions, rare drop chances, automation, advanced techniques. A player who discovers chert and has a hammerstone should be able to knap a blade — they don't need "Crafting 7" to figure out how rocks break. Levels are the "get better at what you already know" axis; discovery and crafting are the "unlock new possibilities" axis.

**Some tools change what's possible. Some tools just make things faster.**
A bamboo knife unlocks hide processing — a new category. An obsidian knife is just faster and more efficient. Both feel good for different reasons. Don't force every upgrade to be a category unlock.

**Passive and semi-idle systems scale with investment.**
Fish traps, crop plots, and smoking racks are semi-idle: the player sets them, a timer runs, and they tap to collect the result. Players who build infrastructure outpace players who only grind actions.

**Exploration is random, not deterministic.**
Biomes are discovered through expeditions that have RNG outcomes. You might find the bamboo grove on your first short scout or your fifth. This is intentional — like hunting for a jungle biome in Minecraft. Navigation skill improves your odds and outcomes but is never a hard gate. Item and vessel gates (raft, dugout, food, water) are the real gates.

**Food and water are expedition fuel.**
No survival meters. No death. But longer expeditions require food and water — making fishing and farming permanently relevant rather than just early-game scaffolding.

---

### Unlock Triggers

Three types of unlock exist, in order of preference for core progression:

| Type | How it works | Example | Use for |
|---|---|---|---|
| **Biome / area discovery** | Exploring finds a new area, unlocking new gathering | Discover jungle interior → clay, fresh water | Core progression |
| **Item / tool / building** | Crafting or obtaining an item triggers new options | Craft hammerstone → stone flake recipe appears | Core progression |
| **Skill threshold** | Reaching a level makes action/recipe available | Fishing 10 → basket trap recipe appears | Optional / efficiency |

**Guideline**: Core progression recipes (tools, buildings, vessels) should be gated by their material/tool/biome dependencies, not skill levels. Skill level gates are appropriate for: efficiency upgrades (faster/better yields), advanced techniques (trapping, farming, automation), and quality-of-life improvements (bulk processing, rare drops). When in doubt, ask: "Could a clever castaway figure this out by having the right materials?" If yes, don't level-gate it.

---

### Semi-Idle: Traps and Farms

Traps and crop plots are not fully idle — they use a **set-and-claim** model:

1. Player performs a setup action (deploy trap, plant crop)
2. A timer runs — this continues offline
3. When timer completes, the structure shows a "ready" state
4. Player taps to collect the result
5. Structure resets for the next cycle (automatically, or requires re-baiting for traps)

This creates a natural check-in loop: you set your traps, go do other things, come back to collect. The Farmville rhythm.



---

## TAB 2: SKILLS

### Skill List

| Skill | What it covers |
|---|---|
| **Foraging** | Gathering plants, fruits, fiber, roots, seeds, shells |
| **Fishing** | All fishing methods — wading, spearing, lines, traps, nets |
| **Woodworking** | Working with bamboo and wood — harvesting, shaping, splitting, felling |
| **Crafting** | General tool-making, lashing, assembly, knapping, pottery shaping |
| **Cooking** | Preparing food over fire — grilling, roasting, boiling |
| **Weaving** | Mats, baskets, traps, nets, cloth, sail |
| **Construction** | Structures, buildings, platforms, stone-work |
| **Farming** | Plot clearing, planting, tending, harvesting, seed saving |
| **Navigation** | Improves expedition outcomes — discovery chance, loot quality, risk reduction |
| **Combat** *(mainland)* | Trained by mainland expeditions. Milestone-only stat bonuses (offense/defense/life/attackSpeed/crit). Never the primary success determinant — gear and planning dominate. |
| **Mining** *(mainland)* | Extracting ore from cliffs and hills. Higher levels gate richer veins (tin Mining 5, iron Mining 10) and give speed bonuses. |
| **Smithing** *(mainland)* | Smelting and forging copper, bronze, iron, and steel. Drives the metal tier, including repair and salvage of equipment. |

> **Preservation** was considered as a skill (drying, smoking, fermenting, sealing) but removed — its recipes are covered by Cooking and Crafting instead. May return if it gets enough distinct content to justify a standalone skill.

### Notes on Specific Skills

**Woodworking** replaces the generic "Woodcutting" found in most games. It covers the full arc of working with wood and bamboo: harvesting canes, splitting, shaping, and eventually felling large trees. Level gates reflect actual skill growth — a high-level woodworker doesn't "unlock a new type of tree" arbitrarily, but they do fell trees more efficiently, get better yields from splitting, and unlock fine shaping recipes.

**Crafting** is the general assembly skill. When a more specialised skill (Woodworking, Weaving, Smithing) applies to a recipe, that skill's level is used instead. Crafting covers everything else: lashing, knapping, pot shaping, hook making, and composite tool assembly.

**Navigation** never gates biomes or expeditions directly. It improves:
- Probability of rare biome discovery per expedition
- Quality tier of loot table rolls
- Reduction of bad-weather risk on long voyages
- Chance of finding multiple things on a single expedition

**Smithing** powers the mainland metal tier. Smelt copper and tin in the crucible (over the Kiln), alloy them into bronze, then advance to iron via the bloomery (a separate furnace requiring bellows and stone anvil), and finally steel (iron + heavy charcoal in a sealed crucible fired in the bloomery). Smithing also handles repair and salvage of all metal equipment.

**Combat** is intentionally light-touch. Combat skill grants only small flat stat bonuses via authored milestones — gear, affixes, imbuement, and route choice are the real success drivers. This is the design's "optionality principle": a player who minimises combat investment can still progress through slower alternatives (mining, charting, smithing efficient gear).

**Mining** gates the deeper ore tiers by skill level (tin Mining 5, iron Mining 10) but the *biome discovery* itself isn't level-gated — players can enter Coastal Cliffs / Inland Hills via either combat expeditions or the non-combat Cartographer's Table charting path.

---

### Skill Unlock Examples

Skill level gates are reserved for **optional/efficiency** unlocks, not core progression. Core tools, buildings, and vessels are gated by discovery and crafting chains instead.

| Skill Level | Unlock | Type | Status |
|---|---|---|---|
| Foraging 5 | Dig clay action (jungle interior) | Efficiency | ✅ |
| Foraging 9 | Wild seed chance from dry grass (milestone) | Milestone bonus | ✅ |
| Fishing 8 | Large fish chance from spear fishing (milestone) | Milestone bonus | ✅ |
| Fishing 11 | Tidal Weir station (set / 8 min / collect) | Advanced technique | ✅ |
| Crafting 6 | Gorge hook recipe | Advanced technique | ✅ |
| Woodworking 10 | Fell large tree action | Advanced technique | ✅ |
| Weaving 4 | Fiber Loom (efficient cordage) | Efficiency | ✅ |
| Construction 13 | Crucible recipe | Advanced technique | ✅ |
| Cooking 12 | Sealed clay jar recipe | Advanced technique | ✅ |
| Any skill 15 | Routines unlock | System unlock | ✅ |
| Mining 5 | Prospect tin deposit | Advanced technique | ✅ |
| Mining 10 | Mine iron ore | Advanced technique | ✅ |
| Combat 2–9 | Equipment tier requirements (copper Lv2–3, bronze 4–5, iron 6–7, steel 8–9) | Gear gates | ✅ |

**Removed level gates** (now gated by discovery/crafting chains only): Hammerstone, Stone Flake, Stone Blade, Shell Adze, Stone Axe, Bamboo Knife, Bow Drill Kit, Split Bamboo Cane, Obsidian Blade. Smithing recipes (smelt/forge) intentionally have no skill-level gates either — material cost and building requirements are the gate.

---

## TAB 3: EARLY GAME PROGRESSION

### Phase 0 — Bare Hands

*Starting state. No tools. The game teaches the loop. Ends quickly.*

**Available actions from the start (Beach):**

| Action | Skill | Drops | Gate |
|---|---|---|---|
| Collect driftwood | Foraging | Driftwood branch ×1 | — |
| Wade tidal pool | Fishing | Small fish (10%), Crab (10%), Shell ×1 | — |

**Unlocked by Coconut Grove biome:**

| Action | Skill | Drops |
|---|---|---|
| Gather fallen coconuts | Foraging | Coconut ×1, Coconut husk (40% chance) |
| Collect palm frond | Foraging | Palm frond ×2 |

**Unlocked by Rocky Shore biome (requires coconut grove):**

| Action | Skill | Drops |
|---|---|---|
| Comb rocky shore | Foraging | Flat stone (20%), Chert (15%) |
| Collect dry grass | Foraging | Dry grass ×1, Wild seed (unlocked by milestone) |

> Note: Driftwood drops only branches in the early game. Planks are not available until woodworking skills and tools allow splitting timber — the question of whether wreckage or other human-origin material exists is deferred.

**First expedition available immediately:**

> **[Expedition] Explore Along the Beach** — short trip, costs 5 food per trip.
> RNG outcomes — may discover: Coconut Grove (found first), then Rocky Shore or Bamboo Grove (both require coconut grove), or just: flat stones, nothing useful.
> Repeat to discover biomes. Coconut grove must be found before rocky shore or bamboo grove can appear. This teaches the player that exploration is probabilistic.

---

### Phase 1 — Bamboo Tier

*Bamboo grove discovered. First tools appear. Cascade of unlocks begins.*

**New gathering actions (Bamboo Grove biome):**

| Action | Skill | Drops |
|---|---|---|
| Harvest bamboo cane | Woodworking | Bamboo cane ×1 |

**Crafting: first tools**

| Recipe | Skill Req | Inputs | Output | Triggers |
|---|---|---|---|---|
| Split bamboo cane | Woodworking | Bamboo cane ×1 | Bamboo splinter ×2 | — |
| Bamboo knife | Crafting | Bamboo splinter ×1 | Bamboo knife | One-time craft |
| Shell beads | Crafting | Shell ×3 | — (morale +2) | Repeatable, crafting XP + morale |
| Shell adze | Crafting | Large shell ×1, Cordage ×2, Driftwood branch ×1 | Shell adze | One-time craft, used for dugout hull scraping |

**Fiber and cordage chain:**

| Action / Recipe | Skill | Inputs | Output |
|---|---|---|---|
| Shred coconut husk | Crafting | Coconut husk ×1 | Rough fiber ×1 |
| Dry fiber | Crafting | Rough fiber ×2 | Dried fiber ×1 (requires drying rack) |
| Twist cordage | Weaving | Dried fiber ×2 | Cordage ×1 |

Cordage is the multiplier: it enables lashing (tools), trapping, fishing lines, and construction.

> Note: The doc previously described a "strip fibrous bark" action and a "rough cordage" intermediate step. The implemented chain is simpler: coconut husk → rough fiber → dried fiber → cordage. There is no vine resource, rough cordage, or bark stripping action.

---

### Phase 1b — Fire

*A parallel track. Fire is a settlement building, not an inventory item. Once lit, it persists.*

| Step | Skill Req | Inputs | Output |
|---|---|---|---|
| Collect dry grass | Foraging | — | Dry grass ×1 (rocky shore biome) |
| Craft bow drill kit | Crafting | Bamboo cane ×1, Driftwood branch ×1, Cordage ×1, Flat stone ×1 | Bow drill kit (one-time craft) |
| Light camp fire | Crafting | Bow drill kit (tool) + Coconut husk ×2, Dry grass ×2, Driftwood branch ×3 | **Camp Fire** (settlement building) |

**Camp Fire unlocks (item-trigger):**
- Cook fish / Cook crab (Cooking skill)
- Fire-harden bamboo tip (spear)
- Smoke food (requires Smoking Rack — not yet built)
- New crafting recipes requiring fire access

**Fire-hardened tools:**

| Recipe | Inputs | Output | Triggers |
|---|---|---|---|
| Bamboo spear | Bamboo cane ×2, bamboo knife (tool), camp fire (building) | Bamboo spear (one-time craft) | Spear fishing action ✅ |

> Digging stick is implemented: bamboo cane ×1 + driftwood branch ×1, requires camp fire building. Gates farming structures.

---

### Phase 2 — Fishing Tiers

*Fishing has five meaningful tiers. Each is a genuine improvement in yield or passivity.*

| Tier | Action | Gates | Key Feature |
|---|---|---|---|
| 1 | Wade tidal pool | None | Available from start. Low yield. ✅ |
| 1b | Comb rock pools | Rocky Shore + Rock Pool Cache building | Improved tidal yields, +3 tidal storage. ✅ |
| 2 | Spear fish | Bamboo spear (crafted) | Reliable yield, +15% large fish and crab chance via milestone. ✅ |
| 3 | Drop line | Gorge hook (Crafting 6, stone flake) | 60% large fish chance, slower but bulk-friendly. ✅ |
| 4 | Basket trap | Woven basket trap (Weaving + Fishing 8, obsidian blade) | **Semi-idle station: set → 2 min timer → tap to collect.** ✅ |
| 5 | Stone tidal weir | Fishing 11 + Stone Tidal Weir building | **Semi-idle station: set → 8 min timer → bulk yield.** ✅ |
| 6 | Net fishing | Future | Bulk catch, rare fish chance. *Not yet built.* |

Both the basket trap and stone weir are semi-idle: set them, let the timer run, tap to collect. The weir is larger, more permanent, and higher yield — a major construction investment that pays off in volume.

---

## TAB 4: SETTLEMENT BUILDINGS

### Fire Tier
```
Camp Fire  →  Stone Hearth  →  (Cooking Hearth — future)
```

| Building | Unlock Req | Adds | Status |
|---|---|---|---|
| Camp Fire | Bow drill kit (tool) + materials | Cooking, hardening, basic fire crafting. +10 food storage. | ✅ |
| Stone Hearth | Materials + camp fire + firing pit | Removes dry grass kindling from cooking. +10 food storage. | ✅ |
| Cooking Hearth | Future | Full cooking range, smoking access | *Not yet built* |

---

### Storage Tier

A wide layer of complementary storage buildings rather than a strict upgrade chain. Each has its own niche.

| Building | Unlock | Capacity / Notes | Status |
|---|---|---|---|
| Palm Leaf Pile | Construction (palm fronds + driftwood) | +10 all item storage | ✅ |
| Fenced Perimeter | Construction (bamboo + cordage + driftwood) | +5 large item storage; +5 max woven baskets | ✅ |
| Woven Basket | Weaving (palm fronds + cordage). Repeatable, up to 20 (or 25 with fenced perimeter) | +1 non-food/non-large storage per basket | ✅ |
| Log Rack | Construction (after large logs available) | +10 large item storage | ✅ |
| Clay Storage Jar | Crafting (sealed clay jar derivative). Up to 5. | +1 food storage per jar | ✅ |
| Storage Shelf | Construction (after thatched hut) | +5 storage for small non-food items; also unlocks +1 routine step + step counts | ✅ |
| Rock Pool Cache | Construction (Rocky Shore biome) | +3 storage for fish / crabs / shells | ✅ |
| Drying Rack | Crafting (bamboo + palm frond) | +10 dried item storage; gates fiber drying | ✅ |

---

### Comfort Tier

Upgrade chain of settlement buildings that slow morale decay during active play. Each tier replaces the previous (non-stacking).

```
Sleeping Mat  →  Hammock  →  Thatched Hut
```

| Building | Unlock | Effect | Status |
|---|---|---|---|
| Sleeping Mat | Construction 4 + materials | Slows morale decay by 20% | ✅ |
| Hammock | Construction 7 + materials. Replaces sleeping mat. | Slows morale decay by 35% | ✅ |
| Thatched Hut | Construction 9 + materials. Replaces hammock. | Slows morale decay by 50%, +5 food storage | ✅ |

Morale decays at 1 point per 2 minutes of active play. Comfort buildings stretch that interval (e.g. thatched hut → 1 point per 4 minutes). Players still use Shell Beads and Maintain Camp for active morale boosts; comfort is the passive mitigation layer.

---

### Processing Stations

| Building | Unlock Req | Enables | Status |
|---|---|---|---|
| Drying Rack | Crafting (bamboo + palm fronds) | Dried fiber. +10 dried storage. | ✅ |
| Fiber Loom | Weaving 4 + materials | Efficient cordage braiding (Braid Cordage: 2 dried fiber → 2 cordage). | ✅ |
| Weaving Frame | Weaving + Fiber Loom built | Sew Sail recipe — pandanus strips → ocean-going sail. | ✅ |
| Soaking Pit | Weaving + Firing Pit | Soak Pandanus station — passive retting (5 min cycle). +5 pandanus storage. | ✅ |
| Firing Pit | Construction (flat stone + driftwood + clay) | Basic pottery (shape/fire clay). | ✅ |
| Pottery Wheel | Crafting + Firing Pit | Halves pot shaping time — Wheel-Throw / Kiln-Fire pot recipes. | ✅ |
| Kiln | Construction 11 + Firing Pit | Advanced pottery, crucible, leather curing. | ✅ |
| Charcoal Kiln | Construction + Kiln + Stone Hearth | Burn Charcoal station (3 large logs → 15 charcoal). +20 charcoal storage. | ✅ |
| Cartographer's Table *(mainland)* | Construction 10 + materials | Charting stations to non-combat-discover Coastal Cliffs and Inland Hills; 10% faster Navigation expeditions. | ✅ |
| Bloomery *(mainland)* | Construction + bellows tool + materials | Iron smelting and steel forging. | ✅ |
| Smoking Rack | Future | Smoked fish/meat — long-duration expedition food | *Not yet built* |
| Workbench | Future | Crafting speed bonus, additional recipes | *Not yet built* |
| Bone Station | Future | Bone hooks, needles, awls | *Not yet built* |

---

### Farming Structures

| Structure | Unlock | Notes | Status |
|---|---|---|---|
| Cleared plot | Construction 3 + digging stick. Max 3. | Single crop slot. Semi-idle: plant → timer → tap to harvest. | ✅ |
| Well | Digging stick + materials (no level gate) | Water source required for taro and later crops; required for the Fill Water Pot recipe. | ✅ |
| Tended garden | Construction 6 + digging stick. Requires cleared plot + well. Replaces cleared plot. Max 3. | Irrigated, supports real crops (taro). | ✅ |
| Farm plot | Construction 8 + digging stick. Requires tended garden + firing pit. Replaces tended garden. Max 3. | Advanced crops (bananas, breadfruit). | ✅ |
| Pandanus Grove | Construction 10 + Farming 7 + well + farm plot | Auto-regrowing pandanus harvest station — no replanting. | ✅ |

---

## TAB 5: FARMING & FORAGING

### Observation-Based Discovery

Wild crops are found via expeditions, not always foraging. When a crop is found during an expedition, it becomes available to transplant. At higher Foraging levels, the player occasionally spots useful plants during gathering too.

### Transplanting Chain

1. Find wild specimen (expedition or foraging find)
2. Dig up cutting / corm (Foraging + Digging stick)
3. Clear a plot (Construction)
4. Plant cutting → timer starts
5. Optional: Tend plot (Farming XP, shortens timer)
6. Tap to harvest when ready → yields crop + new cutting for replanting

### Seed Saving (Farming 20)

Once unlocked, players can save seeds from harvested crops. Sealed clay jars required for storage. Replanting saved seeds yields slightly better results — compounds over generations, simulating slow domestication.

### Crop Roster

| Crop | How Found | Farming Req | Plot Req | Notes | Status |
|---|---|---|---|---|---|
| Wild seeds | Foraging 9 milestone (dry grass), nearby island expedition | — | Cleared plot+ | Yields fiber, root vegetables, seed chance | ✅ |
| Taro | Nearby island expedition (taro corms) | 5 | Tended garden+ | Requires well. Yields taro root + corm propagation (60%) | ✅ |
| Banana | Dugout voyage expedition (banana shoots) | 10 | Farm plot | Requires well. Yields banana ×4 + shoot propagation (70%) | ✅ |
| Breadfruit | Dugout voyage expedition (breadfruit cuttings) | 12 | Farm plot | Requires well. Yields breadfruit ×5 + cutting propagation (50%) | ✅ |
| Coconut | Replant sprouted nut (beach) | 5 | — | Long timer, high long-term yield | *Not yet built* |
| Yam | Expedition | 5 | — | Long grow, good preserved food | *Not yet built* |
| Pandanus | Expedition or foraging | 10 | — | Fiber AND food — dual use | *Not yet built* |
| Sugarcane | Water expedition (nearby island) | 15 | — | Fermentation ingredient, trade good | *Not yet built* |

---

## TAB 6: STONE TOOLS & OBSIDIAN

### Stone Sources

| Material | Where Found | How |
|---|---|---|
| Beach chert | Rocky shore | Comb Rocky Shore action (15% chance, rocky_shore biome) |
| **Obsidian** | **Nearby island** | **Requires water expedition: raft or dugout** |

Obsidian is intentionally gated behind a water expedition. It's the reward for investing in the maritime chain early. This means the raft (or dugout) has a strong pull even before the player is ready for longer voyages.

### Knapping Chain

| Action | Gate | Input | Output | Status |
|---|---|---|---|---|
| Craft hammerstone | Materials only | Flat stone ×2 | Hammerstone | ✅ |
| Strike stone flake | Hammerstone (tool) | Chert ×1 | Stone flake ×2 | ✅ |
| Knap stone blade | Hammerstone (tool) | Stone flake ×2 | Stone blade | ✅ |
| Knap obsidian blade | Obsidian (expedition, requires obsidian item) | Obsidian ×2, Flat stone ×1 | Obsidian blade | ✅ |
| Knap scraper | *TBD* | Stone flake | Stone scraper | *Not yet built* |
| Knap point | *TBD* | Stone blade | Spear / arrow point | *Not yet built* |
| Pressure flake | *TBD* | Stone blade + bone tool | Fine obsidian edge | *Not yet built* |

Obsidian blade is the best cutting tool before metal — improves action speed across several categories, better hide yields, better wood shaping.

### Ground Stone Tools

| Recipe | Skill Req | Inputs | Output | Status |
|---|---|---|---|---|
| Stone axe | Materials only | Stone blade ×2, Driftwood branch ×2, Cordage ×3 | Stone axe | ✅ |
| Grinding stone | Crafting 18 | Sandstone slab | Grinding stone | *Not yet built* |

**The stone axe is the key phase gate.** It unlocks large timber felling → dugout construction → maritime tier.

---

## TAB 7: MARITIME & EXPLORATION

### Vessel Progression
```
Raft (coastal)  →  Dugout (near-shore)  →  Outrigger Canoe (open water — endgame)
```

The vessel chain ends at the outrigger canoe, which fits a sail and outrigger float onto an existing dugout. The outrigger unlocks the **Oceanic Voyage** — the win condition.

### Raft ✅

The raft is an early, low-investment water vessel — enough to reach the nearby island for obsidian. It can't handle open water.

| Recipe | Skill Req | Inputs |
|---|---|---|
| Lash Bamboo Raft | Construction (no level gate) | Bamboo cane + cordage |

### Dugout ✅

A multi-step construction project — the first real engineering effort.

| Step | Skill Req | Inputs | Notes |
|---|---|---|---|
| 1. Fell large tree | Woodworking 10 (action) | Stone axe (tool) | Yields large log. Key level gate. |
| 2. Char log interior | Item-gated | Large log + dry grass + driftwood/charcoal | Camp fire required. Yields charred log. |
| 3. Scrape hull | Tool-gated | Charred log + shell adze | Yields shaped hull. |
| 4. Assemble dugout | Construction (no level gate) | Shaped hull + cordage + bamboo cane | **Dugout complete** — Far Island expedition unlocked. |

### Outrigger Canoe ✅

The endgame vessel — fits a sail (woven from pandanus strips) and an outrigger float onto an existing dugout. Building the outrigger triggers the **Voyage** phase. Pandanus is the bottleneck: dugout voyages return cuttings, the player establishes a grove or farm-plot crop, processes leaves into strips, and weaves them on the Weaving Frame into a sail.

| Step | Skill Req | Inputs | Notes |
|---|---|---|---|
| Sew Sail | Weaving + Weaving Frame | Pandanus strips + rope | One-time craft. |
| Fit Outrigger & Sail | Construction | Dugout + sail + bamboo cane + rope | Replaces dugout building. Triggers Voyage phase. |

The outrigger is the final vessel. There is no separate "sailing canoe" tier — the outrigger fills that role.

---

### Expedition Zones

| Zone | Vessel Req | Food/Water Cost | Notes | Status |
|---|---|---|---|---|
| **Explore beach** | None | 4 food | Discover coconut grove, rocky shore (requires coconut grove). | ✅ |
| **Explore interior** | None (requires coconut grove) | 6 food | Discover bamboo grove, jungle interior (clay deposits). | ✅ |
| **Sail to nearby island** | Raft or Dugout | 7 food | Nearby island biome, obsidian, wild seeds, taro corms. | ✅ |
| **Sail to far island** (Dugout Voyage) | Dugout | 10 food, 3 water | Banana shoots, breadfruit cuttings, pandanus cuttings, obsidian. | ✅ |
| **Oceanic Voyage** | Outrigger Canoe | 10 voyage_provisions, 10 water | Victory expedition — ends the island arc. Returns spare jars. | ✅ |
| **Coastal Ruins** *(mainland)* | Mainland unlocked | 8 food, 2 water | 3 combat stages. Native copper, raw hide, broken Tier-0 gear. Ruin Dust reagent. | ✅ |
| **Tidal Caves** *(mainland)* | Mainland unlocked | 6 food, 2 water | 3 combat stages, wet damage. Discovers Coastal Cliffs (30%). Tidal Salt reagent. | ✅ |
| **Overgrown Trail** *(mainland)* | Mainland unlocked | 10 food, 4 water | 3 combat stages, heat damage. Discovers Inland Hills (25%, requires Coastal Cliffs). Jungle Sap reagent. | ✅ |
| **Flooded Quarry** *(mainland)* | Mainland unlocked | 10 food, 5 water | 3 combat stages, wet damage. Tin ore. Quarry Crystal reagent. | ✅ |
| **Ridge Pass** *(mainland)* | Mainland unlocked | 12 food, 5 water | 3 combat stages, cold damage. Iron ore + charcoal. Ridge Frost reagent. | ✅ |
| **Sunken Temple** *(mainland)* | Mainland unlocked | 15 food, 6 water | 3 combat stages, late-tier. Bronze ingots, idol unique. Temple Incense reagent. | ✅ |
| **Volcanic Rift** *(mainland)* | Mainland unlocked | 18 food, 8 water | 3 combat stages, severe heat. Iron ore, obsidian, magma uniques. Volcanic Shard reagent. | ✅ |
| **Distant archipelago** | Future | High-tier provisions | Rarer affix pools, deeper imbuement variants. | *Not yet built* |

### Navigation Skill Effects

Navigation never gates expeditions. It improves:
- Probability of finding a biome per expedition attempt
- Loot table tier on successful finds
- Chance of multiple finds in one expedition
- Reduced risk of bad weather events on long voyages

High Navigation means you find things faster and better — not that you can go places others can't.

---

## TAB 8: FULL TECH TREE

```
PHASE 0: BARE HANDS ✅
│
├── Forage: coconuts (coconut grove), driftwood branches, palm fronds (coconut grove), dry grass (rocky shore)
├── Comb rocky shore: flat stones (20%), chert (15%)
├── Wade tidal pool / Comb rock pools: shells, small fish, crab, large shell (rare)
├── Dig drainage trench (requires large shell, Construction XP)
└── [Expedition] Explore Beach (4 food) → discover coconut grove, then rocky shore
    │
    ▼
PHASE 1: BAMBOO ✅
│
├── [Expedition] Explore Interior (6 food, requires coconut grove) → bamboo grove, jungle interior
├── Harvest bamboo cane → Split → Bamboo splinter
├── Shred coconut husk → Rough fiber → Dry fiber (drying rack) → Twist/Braid → Cordage
├── Bamboo knife, Shell beads (morale), Shell adze, Maintain camp
│
├── FIRE CHAIN (parallel) ✅
│   ├── Bow drill kit → Light camp fire → Camp Fire [BUILDING]
│   ├── Bamboo spear (camp fire required) → Spear Fishing
│   └── Digging stick → Farming chain
│
└── FISHING ✅
    ├── Spear fish → Drop line (gorge hook) → Basket trap (station) → Stone Tidal Weir (station, Fishing 11)
    │
    ▼
PHASE 2: STONE & CLAY ✅
│
├── STONE TOOLS — Hammerstone → Stone flake → Stone blade → Stone axe (gate for large timber)
├── POTTERY — Shape pot → Fire (firing pit, 70%) / Wheel-throw (pottery wheel) / Kiln-fire (90%) → Sealed jar → Crucible
├── PANDANUS FIBER — Cuttings (dugout voyage) → Grove/Farm plot → leaves → dry/soak → strips → cordage/rope/Sail
├── CHARCOAL — Charcoal Kiln station: 3 large logs → 15 charcoal (alternate fuel, +20 storage)
└── FARMING — Cleared plot → Tended garden → Farm plot. Wild seeds, taro, bananas, pandanus, breadfruit.
    │
    ▼
PHASE 3: MARITIME ✅
│
├── Raft → Sail to Nearby Island (obsidian, wild seeds, taro corms)
├── Fell large tree (Woodworking 10) → Char log → Scrape hull (shell adze) → Assemble dugout
└── Dugout → Sail to Far Island (banana shoots, breadfruit cuttings, pandanus cuttings)
    │
    ▼
PHASE 4: VOYAGE ✅
│
├── Pack Voyage Provisions (5 food + sealed jar)
├── Sew Sail (pandanus strips on weaving frame)
├── Fit Outrigger & Sail → Outrigger Canoe [VESSEL TIER 3]
└── Oceanic Voyage (10 voyage_provisions + 10 water) → VICTORY — landfall on the mainland
    │
    ▼  (player opt-in — experimental)
PHASE 5: MAINLAND ✅
│
├── EXPEDITIONS (combat, multi-stage) ✅
│   ├── Coastal Ruins, Tidal Caves (entry tier — copper/native copper)
│   ├── Overgrown Trail, Flooded Quarry, Ridge Pass (mid tier — bronze/iron ores)
│   └── Sunken Temple, Volcanic Rift (high risk — bronze/iron, unique chase rewards)
│
├── BIOME DISCOVERY
│   ├── Combat path — Coastal Cliffs from Tidal Caves; Inland Hills from Overgrown Trail
│   └── Non-combat path — Cartographer's Table charting stations (slow, multi-session)
│
├── MINING — Prospect copper, Prospect tin (Mining 5), Mine iron (Mining 10)
│
├── SMITHING ✅
│   ├── Crucible recipes — Smelt copper, Smelt tin, Alloy bronze
│   ├── Bloomery (building) — Smelt iron bloom + bellows + stone anvil → Hammer bloom → Iron ingot
│   └── Forge steel (iron + heavy charcoal in sealed crucible, fired in bloomery)
│
├── EQUIPMENT (4 gear tiers) ✅
│   ├── Tier 0 — Improvised: fire-hardened spear, stone club, obsidian dagger, woven fiber vest, bamboo sandals, bamboo buckler
│   ├── Tier 1 — Copper: copper spear, copper axe, copper shield + hide gear set
│   ├── Tier 2 — Bronze: sword, helm, cuirass, shield (Greek-hoplite set)
│   ├── Tier 3 — Iron: full armor set (sword, shield, helm, cuirass, greaves, boots)
│   └── Tier 4 — Steel: full endgame set
│
├── METAL SURVIVAL TOOLS — Copper knife, Bronze axe, Iron pickaxe, Steel pickaxe, Steel knife (speed bonuses on gathering/crafting)
│
└── DEPTH SYSTEMS ✅
    ├── Affixes — 25+ families, expedition-exclusive variants, condition multipliers (broken/damaged/worn/pristine)
    ├── Repair — Smithing recipe per material tag (wood/stone/fiber/hide/metal); upgrades condition by one step
    ├── Salvage — Break down gear into base materials + (future) reagent yields
    └── Imbuement — One stat per item, permanent. 7 reagents, one per mainland expedition.
```

---

## TAB 9: MAINLAND

The mainland is an experimental post-victory phase. Entry is gated by the Oceanic Voyage win and an explicit opt-in modal that warns the content is experimental and may be reset between releases. Mainland progress is tracked under separate flags so it can be wiped without affecting the island save.

### Design pillars

1. **Optionality** — Combat, mining, smithing are *optional* efficiency levers. The island game stands on its own. A player who only dabbles in mainland can still progress (the Cartographer's Table provides a non-combat way to discover mining biomes; the smithing chain has no skill-level gates beyond materials and buildings).
2. **Gear over level** — Combat skill provides only small milestone stat bonuses. Win rates are dominated by gear, affixes, condition, route choice, and supplies — not raw level.
3. **Survival economy stays alive** — Food and water remain real costs. Mainland expeditions have steep food/water budgets, keeping fishing and farming permanently relevant.
4. **Tonal shift, deliberate** — The island survival phase aims for ethnographic realism. The mainland intentionally shifts toward fantasy-RPG: imbuing reagents (Ridge Frost, Quarry Crystal), supernatural enemies (Temple Guardian, Volcanic Horror), environmental hazards modeled as combat encounters. Metal recipes remain metallurgically defensible (bronze needs smelted tin and copper, not raw ore).

### Combat resolution

Mainland expeditions use a deterministic round-based simulation (see `src/engine/combat.ts`):

- Player and enemies trade hits each round based on `attackSpeed` (0.05 hits/round per point above 1.0).
- Player damage = `offense * (1 - enemy_defense_reduction)`, with crit chance/multiplier from affixes.
- Enemy damage splits across damage types (physical / heat / cold / wet); each portion is reduced by the matching resist stat. Endurance grants flat damage reduction on top.
- All reductions use diminishing returns: `stat * scale / (stat * scale + 100)`.
- Speed grants dodge chance.
- Win the encounter by reducing all-stage enemies to 0 HP before the round limit.
- Multi-stage expeditions carry HP between stages.

The expedition panel runs **Monte Carlo simulations** (200 runs per encounter, seeded so the same loadout always produces the same preview) and shows a win-rate estimate plus a stage-clear distribution before commit.

Outcome grades:
- **Success** — full clear with ≥50% HP. Drops 100%, XP 120%.
- **Partial** — clear with low HP, or partial-stage clear. Drops 50–85%, XP 80–100%.
- **Failure** — wipe stage 1. Drops 15%, XP 60%.

### Equipment system

| Slot | Items |
|---|---|
| Weapon | Spears, daggers, swords, axes, harpoons, vine lash |
| Off-hand | Shields, idols, bucklers |
| Head | Helms, caps, crowns |
| Body | Vests, cuirasses |
| Legs | Wraps, leggings, greaves |
| Feet | Sandals, boots |
| Trinket | Medallions, necklaces |

**Conditions** apply a multiplier to all stats (including affixes and imbuement): pristine 1.0×, worn ~0.8×, damaged ~0.5×, broken 0× (cannot equip).

**Affixes** roll within bounded ranges. Families: terrain (heat/cold/wet resist), offense, defense, utility, life, attack speed, crit, plus expedition-exclusive variants (e.g. `affix_ruin_walker` only rolls from Coastal Ruins drops). Each item has a `maxAffixes` limit (typically tier + 1).

**Repair** recipes are tagged by material (wood / stone / fiber / hide / metal) and improve condition one step per use. Smithing-skill scaling is wired in but no current recipe has a level gate (recipes were simplified for accessibility — see 2026-04-11 changelog).

**Salvage** destroys gear and returns base materials scaled by condition (pristine 100% → broken 25%). The reagent-yield path is wired but currently empty.

**Imbuement** consumes one of seven rare reagents (one per mainland expedition) to permanently grant a flat stat bonus to a single item. One imbue per item, ever.

| Reagent | Stat | Source |
|---|---|---|
| Ruin Dust | +5 defense | Coastal Ruins |
| Tidal Salt | +7 wet resist | Tidal Caves |
| Jungle Sap | +5 offense | Overgrown Trail |
| Quarry Crystal | +15 life | Flooded Quarry |
| Ridge Frost | +7 cold resist | Ridge Pass |
| Temple Incense | +5 endurance | Sunken Temple |
| Volcanic Shard | +7 heat resist | Volcanic Rift |

### Smithing chain

```
Crucible (Construction 13, kiln-built)
    ├── Smelt Copper        (copper ore → copper ingot)
    ├── Smelt Tin           (tin ore → tin ingot)
    └── Alloy Bronze        (Cu + Sn ingots → bronze ingot)

Bloomery (building, requires bellows tool)
    ├── Smelt Iron Bloom    (iron ore → iron bloom, in bloomery)
    ├── Hammer Iron Bloom   (bloom → iron ingot, requires stone anvil)
    └── Forge Steel         (iron + 8 charcoal in sealed crucible — slow, costly)
```

Forge recipes consume ingots + materials → equipment outputs (one-time crafts). All forge recipes are gated by the kiln (bronze tier) or bloomery (iron+); no skill-level gates apply.

### Mainland expedition table

See **TAB 7: Expedition Zones**. Briefly: 7 expeditions across three difficulty bands (low / mid / high-risk), each a 3-stage gauntlet with typed damage, base resource drops, equipment drops (often broken), and a unique chase reward + exclusive imbuement reagent.

---

## TAB 10: FUTURE SYSTEMS

| System | Notes |
|---|---|
| **Distant archipelago expeditions** | Higher-tier mainland expeditions with deeper affix pools, rarer uniques. |
| **Magic / supernatural** | Currently hinted at via mainland flavor (idols, reagents, supernatural enemies). Could pay off as a distinct skill or item subsystem. |
| **Automation** | Upgraded stations that run while away. Extends the check-in loop. |
| **More uniques** | Fixed-affix chase items per expedition. Currently 5 uniques across mainland — room for more. |
| **Limited imbuement variants** | Multiple reagents per stat, narrow-band re-rolls. Currently only one reagent → one stat. |
| **Net fishing** | Higher-tier fishing alternative to basket trap and stone weir. Sketched in early designs but not built. |
| **Smoking Rack / Cooking Hearth** | Preserved food for very long voyages. Currently the sealed clay jar covers expedition fuel. |
| **Workbench / Bone Station** | Crafting speed bonuses and bone tool subcategory. Bone tools were sketched in early design but not built. |
| **Other people / lore** | The mainland's ruins, idols, and sentinels imply prior civilizations. Living factions remain deliberately absent — no NPCs or hostile humans. |
