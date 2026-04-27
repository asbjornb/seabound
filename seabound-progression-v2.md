# SeaBound — Progression Design Document v2

---

## IMPLEMENTATION STATUS

*Last updated: 2026-03-29*

### What's Built

- **Phase 0 gameplay loop** — Beach gathering actions (coconuts, driftwood, palm fronds, tidal pool wading). Biomes discovered via scouting expeditions: coconut grove and rocky shore from beach exploration (rocky shore requires coconut grove), bamboo grove and jungle interior from interior exploration (both require coconut grove).
- **Biome-gated gathering** — Gather panel organized by biome. Rocky shore biome gates stones, dry grass, and chert (single "Comb Rocky Shore" action). Coconut grove gates coconuts and palm fronds. Bamboo grove gates bamboo. Jungle interior gates clay and fresh water.
- **Phase 1 bamboo tier** — Bamboo harvesting, splitting, coconut husk fiber/cordage chain, bamboo knife, bow drill kit, bamboo spear, digging stick. No skill level gates — crafting chain dependencies are the gates.
- **Phase 1b fire** — Camp Fire as a settlement building gating cooking and fire-hardened spear.
- **Spear fishing** — Bamboo spear enables spear fishing action (5s, Fishing XP, small fish + shell 30% chance). Fishing 8 milestone unlocks 5% chance of large fish.
- **Drop line fishing** — Gorge hook (Crafting 6, requires stone flake) enables drop line fishing (Fishing 8). 25% large fish chance, slower but better yield.
- **Basket trap** — Woven basket trap (Weaving 5 + Fishing 8, requires obsidian blade) deployed as a station (Fishing 10). Semi-idle set-wait-collect: 2min timer, yields small fish ×2, crab/large fish chances.
- **Shell adze** — Large shell drops from tidal pool wading (1% chance) and interior expeditions. Shell adze crafted from large shell + cordage + driftwood. Used in dugout hull scraping.
- **Stone tools** — No skill level gates. Progression driven by material/tool chain: flat stone → hammerstone → stone flake (requires chert + hammerstone) → stone blade → stone axe. Each step requires output of previous.
- **Clay & pottery** — Jungle interior biome discovered via expedition. Dig clay action (Foraging 5). Full pottery chain: shaped clay pot → fired clay pot → sealed clay jar → crucible. Firing Pit and Kiln buildings.
- **Maritime vessels** — Raft for coastal voyages. Dugout canoe chain: fell large tree → char log interior → scrape hull (shell adze) → assemble dugout. No skill level gates on construction — material chains are the gates.
- **Settlement buildings (15)** — Camp Fire, Stone Hearth, Palm Leaf Pile, Drying Rack, Fenced Perimeter, Firing Pit, Kiln, Fiber Loom, Woven Basket (repeatable), Log Raft, Dugout Canoe, Cleared Plot, Well, Tended Garden, Farm Plot. Buildings gate recipes/actions and grant storage bonuses.
- **Expedition system (4 expeditions)** — Explore Beach (coconut grove, rocky shore discovery), Explore Interior (bamboo grove, jungle interior discovery), Sail Nearby Island (requires raft; nearby island biome, obsidian, wild seeds, taro corms), Dugout Voyage (requires dugout; banana shoots, breadfruit cuttings, obsidian, logs). Auto-repeating with food/water costs. Navigation XP on completion.
- **Morale system** — Shell Beads recipe grants +2 morale (repeatable crafting XP source with morale reward).
- **Skill milestone system** — Authored milestones with mechanical effects (drop chance bonuses, duration multipliers, double output chances) + auto-generated unlock previews from skill-gated actions/recipes.
- **Inventory limits** — Per-item cap of 10, increased by building storage bonuses (Palm Leaf Pile +10 all, Drying Rack +10 dried, Camp Fire +10 food, Stone Hearth +10 food, Woven Basket +1 non-food/non-large per basket up to 20).
- **Action switching** — Starting a new action cancels the current one with full resource refund.
- **Discovery-driven progression** — Core progression gated by biome discovery and crafting chains, not skill levels. Skill levels gate optional efficiency improvements (better yields, advanced techniques). Gather panel grouped by biome to reinforce exploration as progression.
- **9 skills** — Foraging, Fishing, Woodworking, Crafting, Cooking, Weaving, Construction, Farming, Navigation.
- **Weaving recipes** — Weave Basket (palm fronds ×5 + cordage ×3 → woven basket building, repeatable).
- **Cooking recipes** — Cook Fish, Cook Crab (Cooking 2), Cook Large Fish (Cooking 4), Cook Root Vegetable (Cooking 3), Cook Taro (Cooking 5), Roast Breadfruit (Cooking 8). All require camp fire. Stone Hearth removes dry grass kindling from cooking recipes.
- **Voyage Provisions** — Pack 5 food + sealed clay jar into voyage provisions. Efficient expedition fuel.
- **Fresh water** — Collect Fresh Water action (jungle interior biome, requires fired clay pot). Used as expedition fuel for longer voyages.
- **Cordage braiding** — Fiber Loom building enables efficient Braid Cordage recipe alongside basic Twist Cordage.
- **Farming system** — Digging stick (fire-hardened tool) → Cleared Plot (Construction 3) → Well (Construction 6) → Tended Garden (Construction 7) → Farm Plot (Construction 10). Stations: Plant Wild Seeds (3 seeds, yields fiber + root vegetables), Cultivate Taro (Farming 5, needs well), Grow Bananas (Farming 10, needs farm plot), Grow Breadfruit (Farming 12, needs farm plot). Seeds from expedition drops and foraging milestones. Taro corms from nearby island expedition, banana shoots and breadfruit cuttings from dugout voyage.
- **Camp maintenance** — Maintain Camp recipe (cordage + driftwood, Construction XP + morale).
- **Drainage trench** — Dig Drainage Trench action (requires large shell, Construction XP).
- **Offline progress** — All action types progress while away.
- **Save/load** — With migration support for old save formats.

### What's Next

- Phase 2 fishing tiers: stone weir (Fishing 20 + Construction 25), net fishing (Fishing 40 + Weaving 35)
- More settlement buildings (Smoking Rack, Workbench, Bone Station)
- More authored skill milestones
- More Weaving and Construction skill actions
- Navigation effects on expedition odds
- Outrigger canoe and sailing canoe (extending maritime chain beyond dugout)
- Metal tier (ore from island chain expeditions, smithing skill)

### Next Up (After Visual Polish)

- **Action queue** — Lightweight "do A, then B" convenience: when an action is running, the player can queue follow-ups that auto-start when the current one finishes. Implemented and live; queue size grows with the Clay Tablet and Charcoal Board buildings. Routines (saved multi-step sequences) were prototyped and removed in favor of queueing — the queue covers most of the same use cases with much simpler UX.

### Design Ideas (Not Yet Planned)

- **Resource obsolescence** — As players progress, early-phase resources (e.g. rough_fiber, round_stone) should become obsolete. Unlike Unnamed Space Idle's approach of making early resources infinite, we need a thematic solution. Possible approaches: auto-conversion (rough fiber → fiber when you unlock it), removal of obsolete actions/recipes from the UI once superseded, or a "mastery" mechanic where reaching a skill threshold trivializes early resources. Goal: reduce inventory clutter and action list bloat in late game without breaking the castaway theme.

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
> **Smithing** is designed for late game (smelting, casting, forging metal tools) but not yet added as a skill. Will unlock when metal content exists.
>
> **Preservation** was considered as a skill (drying, smoking, fermenting, sealing) but removed — its recipes are covered by Cooking and Crafting instead. May return if it gets enough distinct content to justify a standalone skill.

### Notes on Specific Skills

**Woodworking** replaces the generic "Woodcutting" found in most games. It covers the full arc of working with wood and bamboo: harvesting canes, splitting, shaping, and eventually felling large trees. Level gates reflect actual skill growth — a high-level woodworker doesn't "unlock a new type of tree" arbitrarily, but they do fell trees more efficiently, get better yields from splitting, and unlock fine shaping recipes.

**Crafting** is the general assembly skill. When a more specialised skill (Woodworking, Weaving, Smithing) applies to a recipe, that skill's level is used instead. Crafting covers everything else: lashing, knapping, pot shaping, hook making, and composite tool assembly.

**Navigation** never gates biomes or expeditions directly. It improves:
- Probability of rare biome discovery per expedition
- Quality tier of loot table rolls
- Reduction of bad-weather risk on long voyages
- Chance of finding multiple things on a single expedition

**Smithing** unlocks when the player acquires ore (found via water expeditions) and builds a crucible. It's a full mid-to-late game skill arc with its own progression: copper → bronze → iron. Not yet in the code as a skill.

---

### Skill Unlock Examples

Skill level gates are reserved for **optional/efficiency** unlocks, not core progression. Core tools, buildings, and vessels are gated by discovery and crafting chains instead.

| Skill Level | Unlock | Type | Status |
|---|---|---|---|
| Foraging 5 | Dig clay action (jungle interior) | Efficiency | ✅ |
| Foraging 9 | Wild seed chance from dry grass (milestone) | Milestone bonus | ✅ |
| Fishing 8 | Large fish chance from spear fishing (milestone) | Milestone bonus | ✅ |
| Crafting 6 | Gorge hook recipe | Advanced technique | ✅ |
| Woodworking 10 | Fell large tree action | Advanced technique | ✅ |
| Weaving 15 | Basket trap recipe | Advanced technique | *Not yet built* |
| Weaving 35 | Fishing net recipe | Advanced technique | *Not yet built* |
| Weaving 50 | Sail cloth recipe | Advanced technique | *Not yet built* |
| Construction 25 | Stone tidal weir blueprint | Advanced technique | *Not yet built* |
| Cooking 12 | Sealed clay jar recipe | Advanced technique | ✅ |
| Construction 15 | Crucible recipe | Advanced technique | ✅ |

**Removed level gates** (now gated by discovery/crafting chains only): Hammerstone, Stone Flake, Stone Blade, Shell Adze, Stone Axe, Bamboo Knife, Bow Drill Kit, Split Bamboo Cane, Obsidian Blade.

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
| 2 | Spear fish | Bamboo spear (crafted) | Better yield, large fish at Fishing 8 milestone. ✅ |
| 3 | Drop line | Fishing 8 + Gorge hook (Crafting 6 + stone flake) | 25% large fish chance, slower but reliable. ✅ |
| 4 | Basket trap | Weaving 5 + Fishing 8 + obsidian blade → craft trap; Fishing 10 to deploy | **Semi-idle station: set → 2min timer → tap to collect.** ✅ |
| 5 | Stone tidal weir | Fishing 20 + Construction 25 | **Semi-idle: set → timer → tap to collect.** *Not yet built.* |
| 6 | Net fishing | Fishing 40 + Weaving 35 + net crafted | Bulk catch, rare fish chance. *Not yet built.* |

Both the basket trap and stone weir are semi-idle: set them, let the timer run, tap to collect. The weir is simply larger, more permanent, and higher yield — a major construction investment that pays off in volume.

---

## TAB 4: SETTLEMENT BUILDINGS

### Fire Tier
```
Camp Fire  →  Stone Hearth  →  Cooking Hearth
```

| Building | Unlock Req | Adds | Status |
|---|---|---|---|
| Camp Fire | Bow drill kit (tool) | Cooking, hardening, basic fire crafting. +10 food storage. | ✅ |
| Stone Hearth | Construction 14, requires camp fire + firing pit | Removes dry grass kindling from cooking. +10 food storage. | ✅ |
| Cooking Hearth | Construction 20 | Full cooking range, smoking access | *Not yet built* |

---

### Storage Tier
```
Palm Leaf Pile  →  Fenced Perimeter  →  Woven Basket  →  Raised Cache  →  Storage Hut
```

| Building | Unlock | Capacity / Notes |
|---|---|---|
| Palm Leaf Pile | Construction (palm frond ×8, driftwood ×2) | +10 all item storage | ✅ |
| Fenced Perimeter | Construction 2 (bamboo cane ×6, cordage ×4, driftwood ×3) | Organization (no storage bonus) | ✅ |
| Woven Basket | Weaving (palm frond ×5, cordage ×3). Repeatable, up to 20. | +1 non-food/non-large storage per basket | ✅ |
| Raised Cache | Construction 10 | Larger, off-ground, rain proof | *Not yet built* |
| Storage Hut | Construction 25 | Large, fully weatherproof | *Not yet built* |

---

### Comfort Tier

Upgrade chain of settlement buildings that slow morale decay during active play. Each tier replaces the previous (non-stacking).

```
Sleeping Mat  →  Hammock  →  Thatched Hut
```

| Building | Unlock | Effect | Status |
|---|---|---|---|
| Sleeping Mat | Construction 4 (palm frond ×6, dry grass ×4) | Slows morale decay by 20% | ✅ |
| Hammock | Construction 8 (cordage ×6, dried fiber ×4, driftwood ×2). Replaces sleeping mat. | Slows morale decay by 35% | ✅ |
| Thatched Hut | Construction 11 (bamboo cane ×8, palm frond ×10, cordage ×6, clay ×4). Replaces hammock. | Slows morale decay by 50% | ✅ |

Morale decays at 1 point per 2 minutes of active play. Comfort buildings stretch that interval (e.g. thatched hut → 1 point per 4 minutes). Players still use Shell Beads and Maintain Camp for active morale boosts; comfort is the passive mitigation layer.

---

### Processing Stations

| Building | Unlock Req | Enables | Status |
|---|---|---|---|
| Drying Rack | Crafting (bamboo cane ×4, palm frond ×4) | Dried fiber. +10 dried storage. | ✅ Built |
| Fiber Loom | Weaving 4 (bamboo cane ×4, cordage ×3, palm frond ×2) | Efficient cordage braiding (Braid Cordage: 2 dried fiber → 2 cordage). | ✅ Built |
| Firing Pit | Construction (flat stone ×6, driftwood ×4, clay ×3) | Basic pottery (shape/fire clay). | ✅ Built |
| Kiln | Construction 10 (clay ×10, flat stone ×8, driftwood ×6, cordage ×4). Requires firing pit. | Advanced pottery, crucible. | ✅ Built |
| Smoking Rack | Crafting 8 + Hearth | Smoked fish/meat — long-duration expedition food | *Not yet built* |
| Workbench | Crafting 15 | Crafting speed bonus, additional recipes | *Not yet built* |
| Bone Station | Crafting 10 | Bone hooks, needles, awls | *Not yet built* |

---

### Farming Structures

| Structure | Unlock | Notes | Status |
|---|---|---|---|
| Cleared plot | Construction 3 + digging stick (flat stone ×3, driftwood ×2, cordage ×2). Max 3. | Single crop slot. Semi-idle: plant → timer → tap to harvest. | ✅ Built |
| Well | Construction 6 + digging stick (flat stone ×6, clay ×4, cordage ×3) | Water source required for taro and later crops. | ✅ Built |
| Tended garden | Construction 7 + digging stick. Requires cleared plot + well. Replaces cleared plot. Max 3. | Irrigated, supports real crops (taro). | ✅ Built |
| Farm plot | Construction 10 + digging stick. Requires tended garden + firing pit. Replaces tended garden. Max 3. | Advanced crops (bananas, breadfruit). | ✅ Built |

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
Raft (coastal)  →  Dugout (near-shore)  →  Outrigger Canoe  →  Sailing Canoe (open water)
```

### Raft ✅

The raft is an early, low-investment water vessel — enough to reach the nearby island for obsidian. It can't handle open water.

| Recipe | Skill Req | Inputs |
|---|---|---|
| Build raft | Construction 5 | Driftwood branch ×6, Cordage ×8, Bamboo cane ×4 |

### Dugout ✅

Long build process — the first real construction project.

| Step | Skill Req | Inputs | Notes |
|---|---|---|---|
| 1. Fell large tree | Woodworking 10 (action) | Stone axe (tool) | Yields large log. Key level gate. |
| 2. Char log interior | — (item-gated) | Large log ×1, Dry grass ×4, Coconut husk ×4, Driftwood ×4 | Camp fire required. Yields charred log. |
| 3. Scrape hull | — (item-gated) | Charred log ×1, Shell adze (tool) | Yields shaped hull. |
| 4. Assemble dugout | Construction (recipe, no level gate — gated by tree felling chain) | Shaped hull ×1, Bamboo cane ×4, Cordage ×6 | **Dugout complete** — near-shore expeditions |

### Outrigger

| Component | Skill Req | Inputs |
|---|---|---|
| Outrigger float | Crafting 22 | Curved log + Cordage ×5 |
| Outrigger boom | Crafting 22 | Bamboo ×4 + Cordage ×4 |
| Assemble | Construction 22 | Dugout + float + boom |

### Sailing Canoe

| Component | Skill Req | Inputs |
|---|---|---|
| Mast + step | Construction 25, Crafting 25 | Hardwood + lashing |
| Woven sail | Weaving 50, Crafting 25 | Sail cloth ×6 + bamboo battens |
| Rigging | Crafting 25 | Cordage ×10 |
| **Complete** | All above | Open water unlocked |

---

### Expedition Zones

| Zone | Vessel Req | Food/Water Cost | RNG Notes | Status |
|---|---|---|---|---|
| **Explore beach** | None | 5 food | Discover coconut grove, rocky shore (requires coconut grove), or find flat stones. | ✅ |
| **Explore interior** | None (requires coconut grove) | 8 food | Discover bamboo grove, jungle interior (clay deposits), find materials/shells. | ✅ |
| **Sail nearby island** | Raft or Dugout | 3 food | Discover nearby island biome, find obsidian, wild seeds, taro corms, flat stones. | ✅ |
| **Dugout voyage** | Dugout | 10 food, 3 water | Find banana shoots, breadfruit cuttings, obsidian, large logs, materials. | ✅ |
| **Island reef** | Dugout | Food ×2, Water ×1 | New fish species, coral, sea urchin. | *Not yet built* |
| **Island chain** | Sailing canoe | Food ×10 preserved, Water ×4 | Rare hardwoods, metal ore, new biomes. | *Not yet built* |
| **Distant archipelago** | Sailing canoe | Food ×20 preserved, Water ×8 | Rarest loot, unique building unlocks, affix items. | *Not yet built* |

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
PHASE 0: BARE HANDS
│
├── Forage: coconuts (coconut grove), driftwood branches,
│           palm fronds (coconut grove), dry grass (rocky shore)
├── Comb rocky shore: flat stones (20%), chert (15%)
├── Wade tidal pool: shells, small fish (10%), crab (10%), large shell (1%)
├── Dig drainage trench (requires large shell, Construction XP)
└── [Expedition] Explore Beach (5 food — discover coconut grove, then rocky shore)
    │
    ▼
PHASE 1: BAMBOO TIER ✅
│
├── [Expedition] Explore Interior (8 food, requires coconut grove — discover bamboo grove, jungle interior)
├── Harvest bamboo cane → Split → Bamboo splinter
├── Shred coconut husk → Rough fiber → Dry fiber (drying rack, crafting skill) → Twist/Braid → Cordage
├── Bamboo knife (bamboo splinter)
├── Shell beads (shells → morale +2, crafting XP)
├── Shell adze (large shell + cordage + driftwood)
├── Weave basket (palm fronds ×5 + cordage ×3 → woven basket building, repeatable)
├── Maintain camp (cordage + driftwood → Construction XP + morale)
│
├── FIRE CHAIN (parallel) ✅
│   ├── Collect dry grass (rocky shore)
│   ├── Craft bow drill kit → Light camp fire → Camp Fire [BUILDING: cook, harden, +10 food storage]
│   ├── Bamboo spear (requires bamboo knife + camp fire) [ITEM TRIGGER: spear fishing]
│   └── Digging stick (bamboo + driftwood + camp fire) [ITEM TRIGGER: farming]
│
├── SETTLEMENT ✅
│   ├── Palm leaf pile (+10 all storage)
│   ├── Drying rack (+10 dried storage, gates fiber drying)
│   ├── Fenced perimeter (Construction 2)
│   └── Fiber loom (Weaving 4, efficient cordage braiding)
│
└── FISHING ✅
    ├── Spear fish (spear crafted) ✅
    ├── Drop line (Fishing 8 + gorge hook: Crafting 6 + stone flake) ✅
    ├── Basket trap (Weaving 5 + Fishing 8 + obsidian blade → craft; Fishing 10 to deploy as station) ✅
    └── Stone weir (Fishing 20 + Construction 25) ← NOT YET BUILT
    │
    ▼
PHASE 2: STONE & CLAY ✅
│
├── STONE TOOLS ✅
│   ├── Collect chert (rocky shore, 15% from Comb Rocky Shore)
│   ├── Craft hammerstone (flat stone ×2, materials only)
│   ├── Strike stone flake → Knap stone blade (both require hammerstone tool)
│   └── Stone axe (materials only: stone blade ×2 + driftwood ×2 + cordage ×3) ← PHASE GATE for large timber
│
├── [Expedition] Explore Interior → Discover Bamboo Grove, Jungle Interior ✅
│   └── Dig clay (Foraging 5), Collect fresh water (requires fired clay pot)
│
├── POTTERY ✅
│   ├── Shape clay pot → Fire clay pot (firing pit) → Seal clay jar (Cooking 12, firing pit)
│   ├── Firing Pit [BUILDING: materials only]
│   ├── Kiln [BUILDING: Construction 10, requires firing pit]
│   └── Crucible (Construction 15 + Kiln) ← gates future SMITHING
│
├── MARITIME ✅
│   ├── Raft (Construction 5) → Sail Nearby Island expedition
│   │   └── May find: nearby island biome, OBSIDIAN, wild seeds, taro corms
│   │       └── Obsidian blade (materials only, requires obsidian item) ← best pre-metal cutting tool
│   ├── Fell large tree (Woodworking 10, stone axe, jungle interior) ← KEY LEVEL GATE
│   ├── Dugout chain: char log (camp fire) → scrape hull (shell adze) → assemble (Construction 8)
│   └── Dugout voyage expedition (5 food + 3 water) → banana shoots, breadfruit cuttings
│
├── FARMING ✅
│   ├── Digging stick (fire-hardened tool, requires camp fire)
│   ├── Cleared plot (Construction 3) → Well (Construction 6) → Tended garden (Construction 7) → Farm plot (Construction 10)
│   ├── Plant wild seeds (station: 3 seeds → fiber, root vegetables, seed chance)
│   ├── Cultivate taro (Farming 5, requires well, taro corms from nearby island expedition)
│   ├── Grow bananas (Farming 10, requires farm plot, shoots from dugout voyage)
│   └── Grow breadfruit (Farming 12, requires farm plot, cuttings from dugout voyage)
│
├── COOKING ✅
│   ├── Cook Fish / Cook Crab (Cooking 2) / Cook Large Fish (Cooking 4) / Cook Root Vegetable (Cooking 3)
│   ├── Cook Taro (Cooking 5) / Roast Breadfruit (Cooking 8)
│   ├── Stone Hearth (Construction 14, requires camp fire + firing pit) → removes kindling from cooking
│   └── Voyage Provisions (sealed clay jar + 5 food → efficient expedition fuel)
│
└── FUTURE SETTLEMENT
    ├── Cooking Hearth (Construction 20)
    ├── Smoking rack (preserved food for expeditions)
    └── Workbench, Bone station
        │
        ▼
PHASE 3: ADVANCED MARITIME — NOT YET BUILT
│
├── Outrigger (Construction 22)
├── Sailing Canoe (Weaving 50 + Crafting 25) ← OPEN WATER
│
├── WEAVING DEPTH
│   ├── Trap (Weaving 15) → Net (Weaving 35)
│   └── Sail cloth (Weaving 50) ← gates SAILING CANOE
│
└── Island chain expeditions
    └── Metal ore → Smithing skill → Copper → Bronze → Iron
TAB 9: FUTURE SYSTEMS
System
Notes
Metal tier
Ore found via island chain expeditions. Crucible + Kiln required. Smithing skill: copper → bronze → iron. Full additional act.
Combat
Arrives with island chain (ruins, hostile wildlife). Bone/stone weapons already in tree as stepping stones.
Automation
Late game — NPC helpers for passive structures. Extends the check-in loop at scale.
Rare loot with affixes
Island chain and distant archipelago loot tables. Diablo 2-style rare drops reward long maritime investment.
Magic
Seeded early as strange expedition finds (carved idol, odd herb). Pays off much later.
Other people / lore
No signs of other people until lore is deliberately introduced. The island and surroundings are pristine. Deferred.
