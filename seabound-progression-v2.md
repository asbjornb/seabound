# SeaBound — Progression Design Document v2

---

## IMPLEMENTATION STATUS

*Last updated: 2026-03-17*

### What's Built

- **Phase 0 gameplay loop** — Beach gathering actions (coconuts, driftwood, stones, palm fronds, tidal pool wading). Coconut grove and bamboo grove as discoverable biomes via scouting expeditions (coconut grove discovered first, bamboo grove requires it).
- **Phase 1 bamboo tier** — Bamboo harvesting, splitting, coconut husk fiber/cordage chain, bamboo knife, bow drill kit, bamboo spear.
- **Phase 1b fire** — Camp Fire as a settlement building gating cooking and fire-hardened spear.
- **Spear fishing** — Bamboo spear enables spear fishing action (5s, Fishing XP, small fish + shell 30% chance). Fishing 8 milestone unlocks 5% chance of large fish.
- **Shell adze** — Large shell drops from tidal pool wading. Shell adze crafted from large shell + cordage + driftwood (Crafting 8). Used in dugout hull scraping.
- **Stone tools** — Hammerstone, stone flakes, stone blades (from chert), obsidian blades. Stone axe (Crafting 12) enables large tree felling.
- **Clay & pottery** — Jungle interior biome discovered via expedition. Dig clay action (Foraging 5). Full pottery chain: shaped clay pot → fired clay pot → sealed clay jar → crucible. Firing Pit and Kiln buildings.
- **Maritime vessels** — Raft (Construction 5) for coastal voyages. Dugout canoe chain: fell large tree → char log interior → scrape hull (shell adze) → assemble dugout.
- **Settlement buildings (7)** — Camp Fire, Palm Leaf Pile, Drying Rack, Fenced Perimeter, Firing Pit, Kiln, Fiber Loom. Buildings gate recipes/actions and grant storage bonuses.
- **Expedition system (4 expeditions)** — Explore Beach (coconut grove, bamboo grove discovery), Explore Interior (jungle interior, clay deposits), Sail Nearby Island (requires raft; obsidian, wild seeds), Dugout Voyage (requires dugout). Auto-repeating with food/water costs. Navigation XP on completion.
- **Morale system** — Shell Beads recipe grants +2 morale (repeatable crafting XP source with morale reward).
- **Skill milestone system** — Authored milestones with mechanical effects (drop chance bonuses, duration multipliers, double output chances) + auto-generated unlock previews from skill-gated actions/recipes.
- **Inventory limits** — Per-item cap of 10, increased by building storage bonuses (Palm Leaf Pile +20 raw, Drying Rack +20 processed, Camp Fire +10 food, Fenced Perimeter +10 structure, Firing Pit +10 processed, Kiln +15 processed, Fiber Loom +10 processed).
- **Action switching** — Starting a new action cancels the current one with full resource refund.
- **Gradual unlocks** — Early actions gated behind biome discovery (palm fronds require coconut grove) and skill levels (beach stones at Foraging 2, dry grass at Foraging 3).
- **10 skills** — Foraging, Fishing, Woodworking, Crafting, Cooking, Weaving, Construction, Farming, Navigation, Preservation.
- **Weaving recipes** — Weave Basket (palm fronds + cordage → woven basket).
- **Cooking recipes** — Cook Fish, Cook Crab, Cook Large Fish (require camp fire).
- **Fresh water** — Collect Fresh Water action (Foraging 4, jungle interior biome). Used as expedition fuel for longer voyages.
- **Cordage braiding** — Fiber Loom building enables efficient Braid Cordage recipe alongside basic Twist Cordage.
- **Offline progress** — All action types progress while away.
- **Save/load** — With migration support for old save formats.

### What's Next

- Digging stick (fire-hardened tool, gates farming)
- Farming system (cleared plots, planting, semi-idle set-and-claim)
- Phase 2 fishing tiers: stone weir (Fishing 20 + Construction 25), net fishing (Fishing 40 + Weaving 35)
- More settlement buildings (Stone Hearth, Smoking Rack, Workbench)
- More authored skill milestones
- More Weaving and Construction skill actions
- Navigation effects on expedition odds
- Outrigger canoe and sailing canoe (extending maritime chain beyond dugout)
- Metal tier (ore from island chain expeditions, smithing skill)

### Next Up (After Visual Polish)

- **Farming & Traps** — New mechanic: timed background resource gain with manual collection. Player places a farm plot or trap, it passively accumulates output over time, player collects when ready.
  - *Farming gating options (TBD)*: Either gate behind finding a wild seed (first seed drop from foraging?), or behind an expedition discovery — e.g. "remnants of an old garden" found on another island that teaches the concept. Digging stick already exists as a tool prerequisite.
  - *Trapping gating*: Gate behind a combination of Fishing skill + Crafting skill (e.g. Fishing 5 + Crafting 5). Traps are a fishing-adjacent mechanic — basket traps, snares, stone weirs. Recipes use existing weaving/crafting materials.
  - Both farming and traps should feel like natural mid-game progression, not early-game complexity.

- **Routines** — Lightweight action sequences. Player can define a short queue of actions that run in order instead of a single action. Not full automation — just "do A, then B, then C" convenience.
  - *Gating options (TBD)*: Either unlock when any skill first reaches level 20 (natural mid-game milestone), or gate behind lore scraps found on a new island expedition (thematic — "you find weathered instructions for an efficient workflow"). The expedition gate adds more narrative flavor; the level gate is simpler to implement.
  - Keep routines short (3-5 steps max initially) to stay lightweight and not overwhelm idle balance.

### Design Ideas (Not Yet Planned)

- **Resource obsolescence** — As players progress, early-phase resources (e.g. rough_fiber, round_stone) should become obsolete. Unlike Unnamed Space Idle's approach of making early resources infinite, we need a thematic solution. Possible approaches: auto-conversion (rough fiber → fiber when you unlock it), removal of obsolete actions/recipes from the UI once superseded, or a "mastery" mechanic where reaching a skill threshold trivializes early resources. Goal: reduce inventory clutter and action list bloat in late game without breaking the castaway theme.

---

## TAB 1: DESIGN PRINCIPLES

### Progression Philosophy

**Skills AND recipes both unlock content.**
Skill levels are prerequisites, but crafting a new item can itself trigger new options — a bamboo knife appearing in your inventory unlocks new gathering actions, regardless of what level you are. Both axes matter.

**Some tools change what's possible. Some tools just make things faster.**
A bamboo knife unlocks hide processing — a new category. An obsidian knife is just faster and more efficient. Both feel good for different reasons. Don't force every upgrade to be a category unlock.

**Passive and semi-idle systems scale with investment.**
Fish traps, crop plots, and smoking racks are semi-idle: the player sets them, a timer runs, and they tap to collect the result. Players who build infrastructure outpace players who only grind actions.

**Exploration is random, not deterministic.**
Biomes are discovered through expeditions that have RNG outcomes. You might find the bamboo grove on your first short scout or your fifth. This is intentional — like hunting for a jungle biome in Minecraft. Navigation skill improves your odds and outcomes but is never a hard gate. Item and vessel gates (raft, dugout, food, water) are the real gates.

**Food and water are expedition fuel.**
No survival meters. No death. But longer expeditions require food and water — making fishing, farming, and preservation permanently relevant rather than just early-game scaffolding.

---

### Unlock Triggers

Two types of unlock exist:

| Type | How it works | Example |
|---|---|---|
| **Skill threshold** | Reaching a level makes action/recipe available | Fishing 10 → basket trap recipe appears |
| **Item in inventory / crafted** | Crafting or obtaining an item triggers new options | Crafting bamboo knife → strip fibrous bark unlocked |

Many unlocks require both: the skill level to see the recipe, and crafting the item to trigger the downstream options.

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
| **Preservation** | Drying, smoking, pottery firing, sealing, fermenting |

> **Smithing** is designed for late game (smelting, casting, forging metal tools) but not yet added as a skill. Will unlock when metal content exists.

### Notes on Specific Skills

**Woodworking** replaces the generic "Woodcutting" found in most games. It covers the full arc of working with wood and bamboo: harvesting canes, splitting, shaping, and eventually felling large trees. Level gates reflect actual skill growth — a high-level woodworker doesn't "unlock a new type of tree" arbitrarily, but they do fell trees more efficiently, get better yields from splitting, and unlock fine shaping recipes.

**Crafting** is the general assembly skill. When a more specialised skill (Woodworking, Weaving, Smithing) applies to a recipe, that skill's level is used instead. Crafting covers everything else: lashing, knapping, pot shaping, hook making, and composite tool assembly.

**Navigation** never gates biomes or expeditions directly. It improves:
- Probability of rare biome discovery per expedition
- Quality tier of loot table rolls
- Reduction of bad-weather risk on long voyages
- Chance of finding multiple things on a single expedition

**Cooking** is a separate skill from Preservation. Cooking covers preparing food over fire (grilling, roasting, boiling). Preservation covers drying, smoking, fermenting, and sealing — the food-longevity skills. Both require fire access but serve different purposes.

**Smithing** unlocks when the player acquires ore (found via water expeditions) and builds a crucible. It's a full mid-to-late game skill arc with its own progression: copper → bronze → iron. Not yet in the code as a skill.

---

### Skill Unlock Examples

| Skill Level | Unlock | Status |
|---|---|---|
| Foraging 5 | Dig clay action (jungle interior) | ✅ |
| Foraging 9 | Wild seed chance from dry grass (milestone) | ✅ |
| Fishing 8 | Large fish chance from spear fishing (milestone) | ✅ |
| Woodworking 10 | Fell large tree action | ✅ |
| Crafting 4 | Hammerstone recipe | ✅ |
| Crafting 5 | Strike stone flake recipe | ✅ |
| Crafting 7 | Knap stone blade recipe | ✅ |
| Crafting 8 | Shell adze recipe | ✅ |
| Crafting 9 | Obsidian blade recipe | ✅ |
| Crafting 12 | Stone axe recipe | ✅ |
| Weaving 15 | Basket trap recipe | *Not yet built* |
| Weaving 35 | Fishing net recipe | *Not yet built* |
| Weaving 50 | Sail cloth recipe | *Not yet built* |
| Construction 25 | Stone tidal weir blueprint | *Not yet built* |
| Preservation 15 | Sealed clay jar recipe | ✅ |
| Preservation 18 | Fermentation pot recipe | *Not yet built* |
| Preservation 25 | Crucible recipe | ✅ |

---

## TAB 3: EARLY GAME PROGRESSION

### Phase 0 — Bare Hands

*Starting state. No tools. The game teaches the loop. Ends quickly.*

**Available actions from the start:**

| Action | Skill | Drops | Gate |
|---|---|---|---|
| Gather fallen coconuts | Foraging | Coconut ×1, Coconut husk (40% chance) | Coconut grove biome |
| Collect driftwood | Foraging | Driftwood branch ×1 | — |
| Collect beach stone | Foraging | Flat stone (25% chance) | Foraging 2 |
| Collect palm frond | Foraging | Palm frond ×2 | Coconut grove biome |
| Collect dry grass | Foraging | Dry grass ×1, Wild seed (unlocked by milestone) | Foraging 3 |
| Wade tidal pool | Fishing | Small fish (10%), Crab (10%), Shell ×1 | — |

> Note: Driftwood drops only branches in the early game. Planks are not available until woodworking skills and tools allow splitting timber — the question of whether wreckage or other human-origin material exists is deferred.

**First expedition available immediately:**

> **[Expedition] Scout the island** — short trip, costs 5 food per trip.
> RNG outcomes — may discover: Coconut Grove (found first), then Bamboo Grove (requires coconut grove already discovered), or just: flat stones, nothing useful.
> Repeat to discover biomes. Coconut grove must be found before bamboo grove can appear. This teaches the player that exploration is probabilistic.

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
| Split bamboo cane | Woodworking 1 | Bamboo cane ×1 | Bamboo splinter ×2 | — |
| Bamboo knife | Crafting 2 | Bamboo splinter ×1, Rough fiber ×2 | Bamboo knife | One-time craft |
| Shell beads | Crafting | Shell ×3 | — (morale +2) | Repeatable, crafting XP + morale |
| Shell adze | Crafting 8 | Large shell ×1, Cordage ×2, Driftwood branch ×1 | Shell adze | One-time craft, used for dugout hull scraping |

**Fiber and cordage chain:**

| Action / Recipe | Skill | Inputs | Output |
|---|---|---|---|
| Shred coconut husk | Crafting | Coconut husk ×1 | Rough fiber ×1 |
| Dry fiber | Preservation | Rough fiber ×2 | Dried fiber ×2 (requires drying rack) |
| Twist cordage | Weaving | Dried fiber ×2 | Cordage ×1 |

Cordage is the multiplier: it enables lashing (tools), trapping, fishing lines, and construction.

> Note: The doc previously described a "strip fibrous bark" action and a "rough cordage" intermediate step. The implemented chain is simpler: coconut husk → rough fiber → dried fiber → cordage. There is no vine resource, rough cordage, or bark stripping action.

---

### Phase 1b — Fire

*A parallel track. Fire is a settlement building, not an inventory item. Once lit, it persists.*

| Step | Skill Req | Inputs | Output |
|---|---|---|---|
| Collect dry grass | Foraging 3 | — | Dry grass ×1 |
| Craft bow drill kit | Crafting 2 | Bamboo cane ×1, Driftwood branch ×1, Cordage ×1, Flat stone ×1 | Bow drill kit (one-time craft) |
| Light camp fire | Crafting 2 | Bow drill kit ×1, Coconut husk ×2, Dry grass ×2, Driftwood branch ×3 | **Camp Fire** (settlement building) |

**Camp Fire unlocks (item-trigger):**
- Cook fish / Cook crab (Cooking skill)
- Fire-harden bamboo tip (spear)
- Smoke food (requires Smoking Rack — not yet built)
- New crafting recipes requiring fire access

**Fire-hardened tools:**

| Recipe | Inputs | Output | Triggers |
|---|---|---|---|
| Bamboo spear | Bamboo cane ×2 + camp fire | Bamboo spear (one-time craft) | Spear fishing action ✅ |

> Digging stick is designed but not yet implemented. Will gate farming when added.

---

### Phase 2 — Fishing Tiers

*Fishing has five meaningful tiers. Each is a genuine improvement in yield or passivity.*

| Tier | Action | Gates | Key Feature |
|---|---|---|---|
<<<<<<< HEAD
| 1 | Wade tidal pool | None | Available from start. Low yield. |
| 2 | Spear fish | Bamboo spear (crafted) | Better yield, larger fish possible |
| 3 | Drop line | Fishing 8 + Gorge hook crafted | Better large fish yield ✅ |
| 4 | Basket trap | Fishing 10 + Weaving 15 + trap crafted | Bulk catch with crab bonus ✅ |
| 5 | Stone tidal weir | Fishing 20 + Construction 25 | **Semi-idle: set → timer → tap to collect** |
| 6 | Net fishing | Fishing 40 + Weaving 35 + net crafted | Bulk catch, rare fish chance |
=======
| 1 | Wade tidal pool | None | Available from start. Low yield. ✅ |
| 2 | Spear fish | Bamboo spear (crafted) | Better yield, large fish at Fishing 8 milestone. ✅ |
| 3 | Drop line | Fishing 8 + Gorge hook crafted | Runs passively alongside other actions. *Not yet built.* |
| 4 | Basket trap | Fishing 10 + Weaving 15 + trap crafted | **Semi-idle: set → timer → tap to collect.** *Not yet built.* |
| 5 | Stone tidal weir | Fishing 20 + Construction 25 | **Semi-idle: set → timer → tap to collect.** *Not yet built.* |
| 6 | Net fishing | Fishing 40 + Weaving 35 + net crafted | Bulk catch, rare fish chance. *Not yet built.* |
>>>>>>> origin/main

Both the basket trap and stone weir are semi-idle: set them, let the timer run, tap to collect. The weir is simply larger, more permanent, and higher yield — a major construction investment that pays off in volume.

---

## TAB 4: SETTLEMENT BUILDINGS

### Fire Tier
```
Camp Fire  →  Stone Hearth  →  Cooking Hearth
```

| Building | Unlock Req | Adds |
|---|---|---|
| Camp Fire | Bow drill kit crafted | Cooking, hardening, basic fire crafting |
| Stone Hearth | Construction 10 | Better recipes, warmth bonus for expeditions |
| Cooking Hearth | Construction 20 | Full cooking range, smoking access |

---

### Storage Tier
```
Palm Leaf Pile  →  Fenced Perimeter  →  Woven Basket  →  Raised Cache  →  Storage Hut
```

| Building | Unlock | Capacity / Notes |
|---|---|---|
| Palm Leaf Pile | Construction (palm frond ×8, driftwood ×2) | +20 raw item storage | ✅ |
| Fenced Perimeter | Construction 2 (bamboo cane ×6, cordage ×4, driftwood ×3) | +10 structure storage | ✅ |
| Woven Basket | Weaving 5 | Medium, type-sorted, weather resistant | *Not yet built* |
| Raised Cache | Construction 10 | Larger, off-ground, rain proof | *Not yet built* |
| Storage Hut | Construction 25 | Large, fully weatherproof | *Not yet built* |

---

### Processing Stations

| Building | Unlock Req | Enables | Status |
|---|---|---|---|
| Drying Rack | Crafting (bamboo cane ×4, cordage ×3) | Dried fiber, dried fish, cured hide. +20 processed storage. | ✅ Built |
| Fiber Loom | Weaving 4 (bamboo cane ×6, cordage ×4, palm frond ×4) | Efficient cordage braiding. +10 processed storage. | ✅ Built |
| Firing Pit | Construction 6 (flat stone ×4, clay ×3, driftwood ×2) | Basic pottery (shape/fire clay). +10 processed storage. | ✅ Built |
| Kiln | Construction 10 (flat stone ×6, clay ×5, cordage ×3, driftwood ×4) | Advanced pottery, sealed jars, crucible. +15 processed storage. Requires firing pit. | ✅ Built |
| Smoking Rack | Crafting 8 + Hearth | Smoked fish/meat — long-duration expedition food | *Not yet built* |
| Workbench | Crafting 15 | Crafting speed bonus, additional recipes | *Not yet built* |
| Bone Station | Crafting 10 | Bone hooks, needles, awls | *Not yet built* |

---

### Farming Structures

| Structure | Unlock | Notes |
|---|---|---|
| Cleared plot | Construction 5 + Digging stick | Single crop slot. Semi-idle: plant → timer → tap to harvest |
| Tended garden | Construction 12 | Multiple plots, tending action improves yield |
| Farm plot | Construction 20 | Larger yield, seed saving enabled |

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

Once unlocked, players can save seeds from harvested crops. Sealed clay jars required for storage (Preservation 15). Replanting saved seeds yields slightly better results — compounds over generations, simulating slow domestication.

### Crop Roster

| Crop | How Found | Farming Req | Notes |
|---|---|---|---|
| Taro | Expedition (jungle/stream area) | 1 | Staple, propagates vegetatively |
| Banana | Expedition | 3 | Food + expedition fuel |
| Coconut | Replant sprouted nut (beach) | 5 | Long timer, high long-term yield |
| Breadfruit | Expedition find | 8 | High yield, needs tending action |
| Yam | Expedition | 5 | Long grow, good preserved food |
| Pandanus | Expedition or foraging | 10 | Fiber AND food — dual use |
| Sugarcane | Water expedition (nearby island) | 15 | Fermentation ingredient, trade good |

---

## TAB 6: STONE TOOLS & OBSIDIAN

### Stone Sources

| Material | Where Found | How |
|---|---|---|
| Beach chert | Home island beach | Foraging (Foraging 5) |
| Basalt | Jungle interior | Expedition (food + water required) |
| **Obsidian** | **Nearby island** | **Requires water expedition: raft or dugout** |

Obsidian is intentionally gated behind a water expedition. It's the reward for investing in the maritime chain early. This means the raft (or dugout) has a strong pull even before the player is ready for longer voyages.

### Knapping Chain

| Action | Skill Req | Input | Output | Status |
|---|---|---|---|---|
| Craft hammerstone | Crafting 4 | Flat stone ×2 | Hammerstone | ✅ |
| Strike stone flake | Crafting 5 | Flat stone ×1 + Hammerstone (tool) | Stone flake | ✅ |
| Knap stone blade | Crafting 7 | Stone flake ×2, Chert ×1 | Stone blade | ✅ |
| Knap obsidian blade | Crafting 9 | Obsidian ×1, Hammerstone (tool) | Obsidian blade | ✅ |
| Knap scraper | Crafting 6 | Stone flake | Stone scraper | *Not yet built* |
| Knap point | Crafting 10 | Stone blade | Spear / arrow point | *Not yet built* |
| Pressure flake | Crafting 15 | Stone blade + bone tool | Fine obsidian edge | *Not yet built* |

Obsidian blade is the best cutting tool before metal — improves action speed across several categories, better hide yields, better wood shaping.

### Ground Stone Tools

| Recipe | Skill Req | Inputs | Output | Status |
|---|---|---|---|---|
| Stone axe | Crafting 12 | Stone blade ×1, Driftwood branch ×2, Cordage ×3 | Stone axe | ✅ |
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
| Build raft | Construction 5 | Driftwood branch ×6, Cordage ×4, Bamboo cane ×4 |

### Dugout ✅

Long build process — the first real construction project.

| Step | Skill Req | Inputs | Notes |
|---|---|---|---|
| 1. Fell large tree | Woodworking 10 (action) | Stone axe (tool) | Yields large log. Key level gate. |
| 2. Char log interior | — (item-gated) | Large log ×1, Dry grass ×2 | Camp fire required. Yields charred log. |
| 3. Scrape hull | — (item-gated) | Charred log ×1, Shell adze (tool) | Yields shaped hull. |
| 4. Assemble dugout | Construction 8 (recipe) | Shaped hull ×1, Bamboo cane ×4, Cordage ×6 | **Dugout complete** — near-shore expeditions |

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
| **Explore beach** | None | 5 food | Discover coconut grove, bamboo grove, or find flat stones. | ✅ |
| **Explore interior** | None (requires coconut grove) | 8 food | Discover jungle interior (clay deposits), find bamboo/materials. | ✅ |
| **Sail nearby island** | Raft or Dugout | 3 food | Discover nearby island, find obsidian, wild seeds, flat stones. | ✅ |
| **Dugout voyage** | Dugout | 5 food, 3 water | Open-ended exploration. Currently flavor text only. | ✅ (placeholder) |
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
├── Forage: coconuts (coconut grove), driftwood branches, beach stones (Foraging 2),
│           palm fronds (coconut grove), dry grass (Foraging 3)
├── Wade tidal pool
└── [Expedition] Scout island (5 food cost — discover coconut grove first, then bamboo grove)
    │
    ▼
PHASE 1: BAMBOO TIER ✅
│
├── Harvest bamboo cane → Split → Bamboo splinter
├── Shred coconut husk → Rough fiber → Dry fiber (drying rack) → Twist/Braid → Cordage
├── Bamboo knife (bamboo splinter + rough fiber)
├── Shell beads (shells → morale +2, crafting XP)
├── Shell adze (large shell + cordage + driftwood, Crafting 8)
├── Weave basket (palm fronds + cordage → woven basket)
│
├── FIRE CHAIN (parallel) ✅
│   ├── Collect dry grass (Foraging 3)
│   ├── Craft bow drill kit → Light camp fire → Camp Fire [BUILDING: cook, harden]
│   └── Bamboo spear [ITEM TRIGGER: spear fishing]
│
├── SETTLEMENT ✅
│   ├── Palm leaf pile (+20 raw storage)
│   ├── Drying rack (+20 processed storage, gates fiber drying)
│   ├── Fenced perimeter (+10 structure storage)
│   └── Fiber loom (+10 processed storage, efficient cordage braiding)
│
└── FISHING
    ├── Spear fish (spear crafted) ✅
    ├── Drop line (Fishing 8 + gorge hook crafted) ← NOT YET BUILT
    ├── Basket trap (Fishing 10 + Weaving 15) ← NOT YET BUILT
    └── Stone weir (Fishing 20 + Construction 25) ← NOT YET BUILT
    │
    ▼
PHASE 2: STONE & CLAY ✅ (partially)
│
├── STONE TOOLS ✅
│   ├── Collect chert (Foraging 6, beach)
│   ├── Craft hammerstone (Crafting 4)
│   ├── Strike stone flake → Knap stone blade
│   └── Stone axe (Crafting 12) ← PHASE GATE for large timber
│
├── [Expedition] Explore Interior → Discover Jungle Interior ✅
│   └── Dig clay (Foraging 5), Collect fresh water (Foraging 4)
│
├── POTTERY ✅
│   ├── Shape clay pot → Fire clay pot (firing pit) → Seal clay jar (kiln, Preservation 15)
│   ├── Firing Pit [BUILDING: Construction 6]
│   ├── Kiln [BUILDING: Construction 10, requires firing pit]
│   └── Crucible (Preservation 25 + Kiln) ← gates future SMITHING
│
├── MARITIME ✅
│   ├── Raft (Construction 5) → Sail Nearby Island expedition
│   │   └── May find: OBSIDIAN, wild seeds, nearby island biome
│   │       └── Obsidian blade (Crafting 9) ← best pre-metal cutting tool
│   ├── Fell large tree (Woodworking 10, stone axe) ← KEY LEVEL GATE
│   ├── Dugout chain: char log (item-gated) → scrape hull (shell adze, item-gated) → assemble
│   └── Dugout voyage expedition (5 food + 3 water)
│
├── FARMING — NOT YET BUILT
│   ├── Digging stick (fire-hardened tool)
│   ├── Cleared plot → Tended garden → Farm plot
│   └── Seed saving (Farming 20) → generational yield improvement
│
└── FUTURE SETTLEMENT
    ├── Camp Fire → Stone Hearth → Cooking Hearth
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
