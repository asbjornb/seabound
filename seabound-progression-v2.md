# SeaBound — Progression Design Document v2

---

## IMPLEMENTATION STATUS

*Last updated: 2026-03-16*

### What's Built

- **Phase 0 gameplay loop** — All beach gathering actions (coconuts, driftwood, stones, vine, palm fronds, tidal pool wading). Coconut grove and bamboo grove as discoverable biomes via scouting expeditions.
- **Phase 1 bamboo tier** — Bamboo harvesting, splitting, fiber/cordage chain, bamboo knife, shell scraper, bow drill kit.
- **Phase 1b fire** — Camp Fire as a settlement building gating cooking and fire-hardened tools (spear, digging stick).
- **Settlement buildings** — Camp Fire, Palm Leaf Pile, Drying Rack. Buildings gate recipes/actions and grant storage bonuses.
- **Expedition system** — Scout the Island with RNG biome discovery (coconut grove, bamboo grove). Auto-repeating with food cost (5 food per trip, drawn from any food resource). Navigation XP on completion.
- **Skill milestone system** — Authored milestones with mechanical effects (drop chance bonuses, duration multipliers) + auto-generated unlock previews from skill-gated actions/recipes.
- **Inventory limits** — Per-item cap of 10, increased by building storage bonuses (Palm Leaf Pile +20 raw, Drying Rack +20 processed, Camp Fire +10 food).
- **Action switching** — Starting a new action cancels the current one with full resource refund.
- **Gradual unlocks** — Early actions gated behind biome discovery (palm fronds/vines require coconut grove) and skill levels (beach stones at Foraging 2, dry tinder at Foraging 3).
- **9 skills** — Foraging, Fishing, Woodworking, Crafting, Weaving, Construction, Farming, Navigation, Preservation.
- **Offline progress** — All action types progress while away.
- **Save/load** — With migration support for old save formats.

### What's Next

- Shell adze (needs large_shell drops)
- Farming system (cleared plots, planting, semi-idle set-and-claim)
- Phase 2 fishing tiers (drop line, basket trap, stone weir)
- Jungle interior expedition (food/water costs, basalt/clay/crop discoveries)
- Stone tools chain (knapping: chert → flakes → blades → points)
- More settlement buildings (Stone Hearth, Woven Basket, Smoking Rack, Workbench)
- Find a downstream use for shell beads (currently crafting XP sink — candidates: Shell Necklace craft, expedition trade good, building decoration)
- More authored skill milestones (Fishing and Foraging have hand-crafted ones now)
- Weaving and Construction skill actions
- Navigation effects on expedition odds
- Maritime vessel chain (raft → dugout → outrigger → sailing canoe)

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
| **Weaving** | Mats, baskets, traps, nets, cloth, sail |
| **Construction** | Structures, buildings, platforms, stone-work |
| **Farming** | Plot clearing, planting, tending, harvesting, seed saving |
| **Navigation** | Improves expedition outcomes — discovery chance, loot quality, risk reduction |
| **Preservation** | Drying, smoking, pottery firing, sealing, fermenting |
| **Smithing** | *(Late game)* Smelting, casting, forging metal tools |

### Notes on Specific Skills

**Woodworking** replaces the generic "Woodcutting" found in most games. It covers the full arc of working with wood and bamboo: harvesting canes, splitting, shaping, and eventually felling large trees. Level gates reflect actual skill growth — a high-level woodworker doesn't "unlock a new type of tree" arbitrarily, but they do fell trees more efficiently, get better yields from splitting, and unlock fine shaping recipes.

**Crafting** is the general assembly skill. When a more specialised skill (Woodworking, Weaving, Smithing) applies to a recipe, that skill's level is used instead. Crafting covers everything else: lashing, knapping, pot shaping, hook making, and composite tool assembly.

**Navigation** never gates biomes or expeditions directly. It improves:
- Probability of rare biome discovery per expedition
- Quality tier of loot table rolls
- Reduction of bad-weather risk on long voyages
- Chance of finding multiple things on a single expedition

**Smithing** unlocks when the player acquires ore (found via water expeditions) and builds a crucible. It's a full mid-to-late game skill arc with its own progression: copper → bronze → iron.

---

### Skill Unlock Examples

| Skill Level | Unlock |
|---|---|
| Foraging 5 | Rare plant drops (inner bark, medicinal herbs) |
| Foraging 10 | Spot taro patches, breadfruit trees during expeditions |
| Fishing 8 | Drop line recipe visible |
| Fishing 10 | Basket trap recipe visible |
| Woodworking 5 | Bark strip drops from bamboo harvest |
| Woodworking 15 | Large timber felling (with stone axe) |
| Crafting 8 | Shell adze recipe |
| Crafting 14 | Stone axe recipe |
| Weaving 15 | Basket trap recipe |
| Weaving 35 | Fishing net recipe |
| Weaving 50 | Sail cloth recipe |
| Construction 25 | Stone tidal weir blueprint |
| Preservation 15 | Sealed clay jar recipe |
| Preservation 18 | Fermentation pot recipe |
| Preservation 30 | Crucible recipe |

---

## TAB 3: EARLY GAME PROGRESSION

### Phase 0 — Bare Hands

*Starting state. No tools. The game teaches the loop. Ends quickly.*

**Available actions from the start:**

| Action | Skill | Drops |
|---|---|---|
| Gather fallen coconuts | Foraging | Coconut ×1–2, Coconut husk (chance) |
| Collect driftwood | Foraging | Driftwood branch ×1–2 |
| Collect beach stone | Foraging | Round stone ×1, Flat stone (chance) |
| Collect vine | Foraging | Vine length ×2–3 |
| Collect palm frond | Foraging | Palm frond ×2–3 |
| Wade tidal pool | Fishing | Small fish ×0–1, Crab ×0–1, Shell ×1 |

> Note: Driftwood drops only branches in the early game. Planks are not available until woodworking skills and tools allow splitting timber — the question of whether wreckage or other human-origin material exists is deferred.

**First expedition available immediately:**

> **[Expedition] Scout the island** — very short, no food/water cost, always available.
> RNG outcome — may return: Bamboo Grove discovered, or just: beach stones, vine, nothing useful.
> Repeat until bamboo grove found. This teaches the player that exploration is probabilistic.

---

### Phase 1 — Bamboo Tier

*Bamboo grove discovered. First tools appear. Cascade of unlocks begins.*

**New gathering actions (Bamboo Grove biome):**

| Action | Skill | Drops |
|---|---|---|
| Harvest bamboo cane | Woodworking | Bamboo cane ×1–2; node section (WW 5+) |
| Strip green bamboo | Woodworking | Bamboo strip ×3–4 |

**Crafting: first tools**

| Recipe | Skill Req | Inputs | Output | Triggers |
|---|---|---|---|---|
| Split bamboo cane | Woodworking 1 | Bamboo cane ×1 | Bamboo splinter ×2 | Unlocks: strip fibrous bark, cut vine |
| Bamboo knife | Crafting 2 | Bamboo splinter ×1, Vine ×2 | Bamboo knife | Unlocks: faster fiber stripping, hide processing slot |
| Shell scraper | Crafting 1 | Flat stone ×1, Shell ×1 | Shell scraper | Unlocks: bark scraping |
| Shell adze | Crafting 8 | Large shell ×1, Branch ×1, Cordage ×1 | Shell adze | Unlocks: rough woodworking, hollowing |

**Fiber and cordage chain:**

| Action / Recipe | Skill | Inputs | Output |
|---|---|---|---|
| Strip fibrous bark | Foraging | Bamboo splinter (in inventory) | Rough fiber ×2–3 |
| Roll fiber | Crafting | Rough fiber ×3 | Rough cordage ×1 |
| Dry fiber | Preservation | Rough fiber | Dried fiber (on drying rack) |
| Twist dried fiber | Crafting + Weaving | Dried fiber ×2 | Cordage ×1 |

Cordage is the multiplier: it enables lashing (tools), trapping, fishing lines, and construction.

---

### Phase 1b — Fire

*A parallel track. Fire is a settlement building, not an inventory item. Once lit, it persists.*

| Step | Skill Req | Inputs | Output |
|---|---|---|---|
| Collect dry tinder | Foraging 2 | — | Coconut husk fiber, Dry grass |
| Craft bow drill kit | Crafting 2 | Bamboo cane, Branch, Rough cordage, Flat stone | Bow drill kit |
| Light fire | Crafting 2 | Bow drill kit + tinder | **Camp Fire** (settlement building) |

Success rate scales with Crafting level — the tooltip says so, teaching the skill system.

**Camp Fire unlocks (item-trigger):**
- Cook food
- Harden bamboo tip (fire-hardening action)
- Smoke food (requires Smoking Rack later)
- New crafting recipes requiring fire access

**Fire-hardened tools:**

| Recipe | Inputs | Output | Triggers |
|---|---|---|---|
| Fire-hardened spear | Bamboo cane ×2 + fire | Bamboo spear | Spear fishing action |
| Fire-hardened digging stick | Bamboo ×1 + fire | Digging stick | Dig clay, till soil |

---

### Phase 2 — Fishing Tiers

*Fishing has five meaningful tiers. Each is a genuine improvement in yield or passivity.*

| Tier | Action | Gates | Key Feature |
|---|---|---|---|
| 1 | Wade tidal pool | None | Available from start. Low yield. |
| 2 | Spear fish | Bamboo spear (crafted) | Better yield, larger fish possible |
| 3 | Drop line | Fishing 8 + Gorge hook crafted | Runs passively alongside other actions |
| 4 | Basket trap | Fishing 10 + Weaving 15 + trap crafted | **Semi-idle: set → timer → tap to collect** |
| 5 | Stone tidal weir | Fishing 20 + Construction 25 | **Semi-idle: set → timer → tap to collect** |
| 6 | Net fishing | Fishing 40 + Weaving 35 + net crafted | Bulk catch, rare fish chance |

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
Palm Leaf Pile  →  Woven Basket  →  Raised Cache  →  Storage Hut
```

| Building | Unlock | Capacity / Notes |
|---|---|---|
| Palm Leaf Pile | Start | Small, degrades in rain events |
| Woven Basket | Weaving 5 | Medium, type-sorted, weather resistant |
| Raised Cache | Construction 10 | Larger, off-ground, rain proof |
| Storage Hut | Construction 25 | Large, fully weatherproof |

---

### Processing Stations

| Building | Unlock Req | Enables |
|---|---|---|
| Drying Rack | Crafting 5, Woodworking 5 | Dried fiber, dried fish, cured hide |
| Smoking Rack | Crafting 8 + Hearth | Smoked fish/meat — long-duration expedition food |
| Clay Pit | Clay deposit found via expedition | Dig clay action |
| Firing Pit | Construction 12 | Basic pottery |
| Kiln | Construction 25, Crafting 20 | Better pottery, bricks, eventually smelting |
| Loom Frame | Weaving 20 | Woven cloth, advanced patterns |
| Workbench | Crafting 15 | Crafting speed bonus, additional recipes |
| Bone Station | Crafting 10 | Bone hooks, needles, awls |

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

| Action | Skill Req | Input | Output |
|---|---|---|---|
| Strike flake | Crafting 5 | Stone + Hammerstone | Stone flake |
| Knap scraper | Crafting 6 | Stone flake | Stone scraper |
| Knap blade | Crafting 8 | Chert/obsidian | Stone blade |
| Knap point | Crafting 10 | Stone blade | Spear / arrow point |
| Pressure flake | Crafting 15 | Stone blade + bone tool | Fine obsidian edge |

Obsidian blade is the best cutting tool before metal — improves action speed across several categories, better hide yields, better wood shaping.

### Ground Stone Tools

| Recipe | Skill Req | Inputs | Output | Triggers |
|---|---|---|---|---|
| Ground adze head | Crafting 12 | Basalt ×2 + Sandstone abrader | Stone adze head | Tree felling (with haft) |
| Stone axe | Crafting 14 | Adze head + Hardwood haft + Cordage ×3 | Stone axe | Large timber felling |
| Grinding stone | Crafting 18 | Sandstone slab | Grinding stone | Grain and seed processing |

**The stone axe is the key phase gate.** It unlocks large timber felling → dugout construction → maritime tier.

---

## TAB 7: MARITIME & EXPLORATION

### Vessel Progression
```
Raft (coastal)  →  Dugout (near-shore)  →  Outrigger Canoe  →  Sailing Canoe (open water)
```

### Raft

The raft is an early, low-investment water vessel — enough to reach the nearby island for obsidian. It can't handle open water.

| Recipe | Skill Req | Inputs |
|---|---|---|
| Lash log raft | Construction 8, Woodworking 5 | Large branches ×6, Cordage ×8, Bamboo poles ×4 |

### Dugout

Long build process — the first real construction project.

| Step | Skill Req | Notes |
|---|---|---|
| 1. Fell large tree | Woodworking 15, Stone axe | Long action |
| 2. Char interior | Woodworking 16, Fire | Repeated burn cycles |
| 3. Scrape char | Woodworking 17, Shell adze | Opens hull progressively |
| 4. Shape hull | Crafting 20, Woodworking 18 | Multiple iterations |
| **Dugout complete** | — | Near-shore expeditions |

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

| Zone | Vessel Req | Food/Water Cost | RNG Notes |
|---|---|---|---|
| **Scout island** | None | None | First expedition. May find bamboo grove or nothing. Repeat until found. |
| **Jungle interior** | None | Food ×2, Water ×1 | May find: basalt, clay deposit, taro, medicinal herbs, or nothing. Multiple visits likely needed. |
| **Nearby island** | Raft or Dugout | Food ×3, Water ×2 | May find: obsidian, new crops, different stone. Obsidian not guaranteed first visit. || **Island reef** | Dugout | Food ×2, Water ×1 | New fish species, coral, sea urchin. Reef reliably found after a few tries. |
| **Island chain** | Sailing canoe | Food ×10 preserved, Water ×4 | Rare hardwoods, metal ore, new biomes. High variance — many possible finds. |
| **Distant archipelago** | Sailing canoe | Food ×20 preserved, Water ×8 | Rarest loot, unique building unlocks, affix items. |

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
├── Forage: coconuts, driftwood branches, beach stones, vine, palm fronds
├── Wade tidal pool
└── [Expedition] Scout island (RNG — keep trying until bamboo grove found)
    │
    ▼
PHASE 1: BAMBOO TIER
│
├── Harvest bamboo cane → Split → Bamboo splinter [ITEM TRIGGER: new actions]
├── Strip fibrous bark → Roll/Twist → Cordage
├── Bamboo knife [ITEM TRIGGER: faster stripping, hide slot]
├── Shell scraper, Shell adze
│
├── FIRE CHAIN (parallel)
│   ├── Collect dry tinder (Foraging 2)
│   ├── Craft bow drill kit → Light fire → Camp Fire [ITEM TRIGGER: cook, harden, smoke]
│   ├── Fire-hardened spear [ITEM TRIGGER: spear fishing]
│   └── Fire-hardened digging stick [ITEM TRIGGER: dig clay, till soil]
│
└── FISHING (parallel, ongoing)
    ├── Spear fish (spear crafted)
    ├── Drop line (Fishing 8 + gorge hook crafted)
    ├── Basket trap (Fishing 10 + Weaving 15) ← SEMI-IDLE: set and claim
    └── Stone weir (Fishing 20 + Construction 25) ← SEMI-IDLE: set and claim
    │
    ▼
PHASE 2: SETTLEMENT
│
├── Camp Fire → Stone Hearth → Cooking Hearth
├── Storage: Palm pile → Basket → Raised cache → Hut
├── Drying rack → Smoking rack (preserved food for expeditions)
├── Workbench, Bone station, Loom frame
│
├── FARMING (semi-idle: set and claim)
│   ├── [Expedition finds] → Transplant taro, banana, yam, breadfruit
│   ├── Cleared plot → Tended garden → Farm plot
│   └── Seed saving (Farming 20) → generational yield improvement
│
└── [Expedition] Jungle interior (food + water cost)
    └── May find: basalt, clay deposit, new crops, medicinal herbs
        │
        ▼
PHASE 3: STONE TOOLS
│
├── Beach chert (foraging) → knap flakes, blades, points
├── Basalt (jungle expedition) → ground adze head → Stone axe ← PHASE GATE
│
├── [Expedition] Nearby island (raft or dugout required)
│   └── May find: OBSIDIAN ← sharpest pre-metal cutting tool
│       └── Obsidian blade → speed/yield improvement across many actions
│
├── POTTERY (clay deposit found via jungle expedition)
│   ├── Clay pit → shape pot → firing pit → kiln
│   ├── Sealed clay jar (Preservation 15) ← required for long expeditions
│   └── Crucible (Preservation 30 + Kiln) ← gates SMITHING
│
└── WEAVING DEPTH
    ├── Mat → Basket → Trap (Weaving 15) → Net (Weaving 35)
    └── Sail cloth (Weaving 50) ← gates SAILING CANOE
        │
        ▼
PHASE 4: MARITIME
│
├── Raft (Construction 8) ← enough for nearby island
├── Dugout (Stone axe + Woodworking 15) ← near-shore range
├── Outrigger (Construction 22)
└── Sailing Canoe (Weaving 50 + Crafting 25) ← OPEN WATER
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
