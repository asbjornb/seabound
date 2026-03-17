# SeaBound Game Reference

> **Auto-generation note:** This file is manually maintained. When you add/change
> items in `src/data/`, update this doc to match. A future script could generate
> it from the data files — see [Keeping This Updated](#keeping-this-updated).

---

## Skills (9)

| Skill | Description |
|-------|-------------|
| Foraging | Gathering plants, fruits, fiber, roots, seeds, shells |
| Fishing | Wading, spearing, lines, traps, nets |
| Woodworking | Bamboo and wood — harvesting, shaping, splitting, felling |
| Crafting | Tool-making, lashing, assembly, knapping, pottery shaping |
| Weaving | Mats, baskets, traps, nets, cloth, sail |
| Construction | Structures, buildings, platforms, stone-work |
| Farming | Plot clearing, planting, tending, harvesting, seed saving |
| Navigation | Expedition outcomes — discovery chance, loot quality, risk reduction |
| Preservation | Drying, smoking, pottery firing, sealing, fermenting |

**XP formula:** `100 * (level - 1) * 1.15^(level - 2)` — quadratic scaling, max level 99.

---

## Actions (11)

### Phase 0 — Bare Hands

| Action | Skill | Time | Drops | Gate |
|--------|-------|------|-------|------|
| Gather Fallen Coconuts | Foraging | 3s | Coconut ×1, Coconut Husk (40%) | Coconut Grove biome |
| Collect Driftwood | Foraging | 3s | Driftwood Branch ×1 | — |
| Collect Beach Stone | Foraging | 3s | Round Stone ×1, Flat Stone (25%) | Foraging 2 |
| Collect Vine | Foraging | 3.5s | Vine ×2 | Coconut Grove biome |
| Collect Palm Frond | Foraging | 3s | Palm Frond ×2 | Coconut Grove biome |
| Collect Dry Tinder | Foraging | 4s | Coconut Husk Fiber ×1, Dry Grass ×1 | Foraging 3 |
| Wade Tidal Pool | Fishing | 4s | Small Fish (10%), Crab (10%), Shell ×1 | — |

### Phase 1 — Bamboo Tier

| Action | Skill | Time | Drops | Gate |
|--------|-------|------|-------|------|
| Harvest Bamboo Cane | Woodworking | 4s | Bamboo Cane ×1 | Bamboo Grove biome |
| Strip Green Bamboo | Woodworking | 4.5s | Bamboo Strip ×3 | Bamboo Grove biome |
| Strip Fibrous Bark | Foraging | 3.5s | Rough Fiber ×2 | Bamboo Splinter (tool) |

### Phase 2 — Fishing

| Action | Skill | Time | Drops | Gate |
|--------|-------|------|-------|------|
| Spear Fish | Fishing | 5s | Small Fish ×1, Shell (30%) | Bamboo Spear (tool) |

---

## Recipes (14)

### Bamboo Tools

| Recipe | Skill | Inputs | Output | Gate |
|--------|-------|--------|--------|------|
| Split Bamboo Cane | Woodworking | Bamboo Cane ×1 | Bamboo Splinter ×2 | — |
| Bamboo Knife | Crafting | Bamboo Splinter ×1, Vine ×2 | Bamboo Knife ×1 | Crafting 2, one-time |

### Fiber & Cordage

| Recipe | Skill | Inputs | Output | Gate |
|--------|-------|--------|--------|------|
| Roll Rough Cordage | Crafting | Rough Fiber ×3 | Rough Cordage ×1 | — |
| Dry Fiber | Preservation | Rough Fiber ×2 | Dried Fiber ×2 | — |
| Twist Cordage | Crafting | Dried Fiber ×2 | Cordage ×1 | — |

### Fire Chain

| Recipe | Skill | Inputs | Output | Gate |
|--------|-------|--------|--------|------|
| Bow Drill Kit | Crafting | Bamboo Cane, Driftwood, Rough Cordage, Flat Stone | Bow Drill Kit ×1 | Crafting 2, one-time |

### Settlement Buildings

| Recipe | Skill | Inputs | Builds | Gate |
|--------|-------|--------|--------|------|
| Light Camp Fire | Crafting | Bow Drill Kit, Coconut Husk Fiber ×2, Dry Grass ×2, Driftwood ×3 | Camp Fire | Crafting 2 |
| Palm Leaf Pile | Construction | Palm Frond ×8, Driftwood ×2 | Palm Leaf Pile | — |
| Drying Rack | Crafting | Bamboo Cane ×4, Cordage ×3 | Drying Rack | Crafting 5 |

### Fire-Dependent

| Recipe | Skill | Inputs | Output | Gate |
|--------|-------|--------|--------|------|
| Bamboo Spear | Crafting | Bamboo Cane ×2 | Bamboo Spear ×1 | Camp Fire, one-time |
| Digging Stick | Crafting | Bamboo Cane ×1 | Digging Stick ×1 | Camp Fire, one-time |
| Cook Fish | Crafting | Small Fish ×1 | Cooked Fish ×1 | Camp Fire |
| Cook Crab | Crafting | Crab ×1 | Cooked Crab ×1 | Camp Fire |

---

## Tools (5)

| Tool | How to Get | Unlocks |
|------|-----------|---------|
| Bamboo Knife | Craft: Bamboo Splinter + Vine ×2 | Strip Fibrous Bark action |
| Bow Drill Kit | Craft: Bamboo Cane + Driftwood + Rough Cordage + Flat Stone | Fire-starting (Camp Fire recipe) |
| Bamboo Spear | Craft at Camp Fire: Bamboo Cane ×2 | Spear Fish action |
| Digging Stick | Craft at Camp Fire: Bamboo Cane | Dig clay, till soil (future) |

---

## Buildings (3)

| Building | Built From | Storage Bonus | Unlocks |
|----------|-----------|---------------|---------|
| Camp Fire | Light Camp Fire recipe | Food +10 | Cooking, fire-hardened tools, smoking |
| Palm Leaf Pile | Palm Leaf Pile recipe | Raw +20 | Organized raw material storage |
| Drying Rack | Drying Rack recipe | Processed +20 | Faster fiber drying, dried fish, cured hide |

---

## Resources (27)

### Raw Materials (Phase 0)
Coconut, Coconut Husk, Driftwood Branch, Round Stone, Flat Stone, Vine, Palm Frond, Shell

### Raw Materials (Phase 1)
Bamboo Cane, Rough Fiber, Large Shell

### Raw Materials (Fire)
Coconut Husk Fiber, Dry Grass

### Processed
Bamboo Splinter, Bamboo Strip, Rough Cordage, Dried Fiber, Cordage

### Food
Small Fish, Crab, Cooked Fish, Cooked Crab

### Tools
Bamboo Knife, Bow Drill Kit, Bamboo Spear, Digging Stick

---

## Expeditions (1)

| Expedition | Skill | Time | Cost | Outcomes |
|------------|-------|------|------|----------|
| Scout the Island | Navigation | 8s | 5 food | Discover Coconut Grove (25%), Discover Bamboo Grove (10%, needs Coconut Grove), Find stones (30%), Nothing (35%) |

---

## Biomes (4)

| Biome | How to Unlock | Status |
|-------|--------------|--------|
| Beach | Starting biome | Implemented |
| Coconut Grove | Scout the Island expedition | Implemented |
| Bamboo Grove | Scout the Island (requires Coconut Grove) | Implemented |
| Jungle Interior | — | Not yet implemented |

---

## Milestones

### Authored (hand-crafted effects)

| Skill | Level | Effect |
|-------|-------|--------|
| Fishing | 2 | +2% fish and crab chance from tidal pools |
| Fishing | 3 | +2% fish and crab chance from tidal pools |

### Auto-Generated
Unlock milestones are auto-generated from any action/recipe with a `requiredSkillLevel > 1`.

**Milestone effect types:** `drop_chance` (bonus % for specific drops), `duration` (action speed multiplier).

---

## Progression Flow

```
Beach (start)
  ├── Collect Driftwood, Wade Tidal Pool
  └── Scout the Island (expedition)
        ├── Coconut Grove → Gather Coconuts, Collect Vine, Palm Frond
        │     └── Bamboo Grove → Harvest Bamboo, Strip Green Bamboo
        │           └── Split Bamboo → Bamboo Knife → Strip Fibrous Bark
        │                 └── Fiber → Cordage chain
        │                       └── Bow Drill Kit → Light Camp Fire
        │                             ├── Cook Fish / Crab
        │                             ├── Bamboo Spear → Spear Fish
        │                             └── Digging Stick → (future farming)
        └── Foraging 2 → Beach Stone
              └── Foraging 3 → Dry Tinder
```

---

## Keeping This Updated

### Option 1: Auto-generated doc (recommended for now)

Add a script that reads the data files and generates this markdown:

```bash
# e.g. scripts/gen-reference.ts
npx tsx scripts/gen-reference.ts > GAME-REFERENCE.md
```

Hook it into CI or a pre-commit hook so it never goes stale. This is the
simplest approach — the data files *are* the source of truth, and the doc
is just a readable view of them.

### Option 2: In-game codex / help panel

Build the reference directly into the UI from the same data files. Players
can browse it in-game. No separate doc to maintain.

### Option 3: Wiki (later)

A wiki (GitHub Wiki, or a dedicated site) makes sense once there's a
community contributing. Until then it's just another thing to keep in sync.
The auto-generated approach works better for a solo/small team — the code
*is* the wiki.

### Recommendation

**Start with Option 1 (generated doc) now.** The data files are already
well-structured for it. When the game grows, add Option 2 (in-game codex)
as a player-facing feature. Save a wiki for when there are contributors
who aren't reading the source.
