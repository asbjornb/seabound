# Wild Seed Farming Progression Plan

## Overview

A complete farming system starting from wild seeds, using the existing **station** (set-wait-collect) pattern for the semi-idle plant→wait→harvest loop. Farming is an **optional efficiency play** — never a gate, always a choice alongside fishing and other food sources. Early farming is a seed sink that forces continued foraging/expeditions; later milestones gradually flip it toward self-sustaining.

---

## Design Principles

1. **Farming is optional** — it's an efficiency path, not a gate. Players can invest in fishing, farming, both, or neither. Provisions and expeditions accept any food, not farming-specific food.
2. **Wild seeds are a SINK early on** — spend 3, get back ~1 on average. Forces continued foraging/expeditions. Milestones gradually improve this until Farming 8 makes it break-even.
3. **Semi-idle via stations** — reuses the existing basket trap pattern. Plant → wait → collect. No new engine mechanics needed.
4. **Upgrade, don't multiply** — one plot building that upgrades through 3 tiers, not separate buildings. Cleaner progression.
5. **Well replaces water consumption** — farming requires a Well building (one-time construction) rather than consuming expensive fresh water per planting.
6. **Longer timers, better yields** — station timers are 3-10 minutes so offline time (even just minutes) feels worthwhile.
7. **Skill caps**: Pre-dugout content = Farming 1-10. Post-dugout content = Farming 10-18. Nothing above 20 for now.

---

## Phase 1: Digging Stick & Cleared Plot (Entry Gate)

### New Tool: Digging Stick
- **Recipe**: `craft_digging_stick`
- **Skill**: Crafting
- **Inputs**: Bamboo cane ×1, driftwood branch ×1
- **Required building**: Camp fire (fire-hardening the tip)
- **One-time craft**
- **Why**: Gates all farming. Cheap once you have fire, but not free — you need the bamboo + fire chain first.

### New Building: Cleared Plot (Tier 1)
- **Recipe**: `build_cleared_plot`
- **Skill**: Construction (level 3)
- **Inputs**: Flat stone ×3, driftwood branch ×2, cordage ×2
- **Required tool**: Digging stick
- **Building**: `cleared_plot`
- **Max count**: 3 (player can build up to 3 independent plots)
- **Why**: Each plot is one crop slot. Modest cost but competes with other construction needs.

---

## Phase 2: Wild Planting (Farming Skill Bootstrap)

### New Station: Plant Wild Seeds
- **Station**: `plant_wild_seeds`
- **Skill**: Farming (level 1)
- **Required building**: Cleared plot
- **Required tool**: Digging stick
- **Setup inputs**: Wild seed ×3 (consumed on planting)
- **Duration**: 180 seconds (3 min)
- **Yields**:
  - Rough fiber ×2 (guaranteed — weedy stalks, useful for cordage chain)
  - Wild seed ×1 (35% chance — sometimes you get a seed back)
  - Root vegetable ×1 (25% chance — occasional food find)
- **XP**: 15 farming XP
- **Max deployed**: Equal to number of cleared plots owned
- **Why**: This is the **seed sink**. You spend 3 seeds and on average get ~0.35 back — a steep 88% loss rate. But rough fiber is always useful (feeds into cordage), and the root vegetable teases farming's food potential. Players must keep foraging (Foraging 9 milestone) or running Nearby Island expeditions to sustain planting. The brutal early rate creates room for satisfying milestones.

### New Resource: Root Vegetable
- **ID**: `root_vegetable`
- **Name**: Root Vegetable
- **Description**: "A knobby tuber dug up from wild planting. Edible raw, better cooked."
- **Tags**: `["food"]`

### New Recipe: Cook Root Vegetable
- **Recipe**: `cook_root_vegetable`
- **Skill**: Cooking (level 3)
- **Inputs**: Root vegetable ×1, driftwood branch ×1, dry grass ×1 (removed by stone hearth)
- **Output**: Cooked root vegetable ×1
- **Required building**: Camp fire
- **XP**: 8 cooking XP

### New Resource: Cooked Root Vegetable
- **ID**: `cooked_root_vegetable`
- **Name**: Cooked Root Vegetable
- **Description**: "A fire-roasted tuber. Filling and surprisingly tasty."
- **Tags**: `["food"]`

### Early Farming Milestones (improve the seed sink)

| Level | Milestone | Effect |
|-------|-----------|--------|
| 3 | Hardy seeds — wild seed return chance improved | +15% wild seed drop (35% → 50%) |
| 5 | Careful planting — root vegetable chance improved | +15% root vegetable drop (25% → 40%) |
| 7 | Efficient sowing — plant wild seeds costs 2 seeds instead of 3 | Reduce setup input from 3 → 2 |

These milestones make wild planting gradually less punishing. At level 7, you spend 2 seeds and get ~0.5 back (75% loss) with a 40% food chance — still a sink but much more tolerable.

---

## Phase 3: Well & Tended Garden (Farming 5, Pre-Dugout)

### New Building: Well
- **Recipe**: `build_well`
- **Skill**: Construction (level 6)
- **Inputs**: Flat stone ×6, clay ×4, cordage ×3
- **Required tool**: Digging stick
- **Building**: `well`
- **Why**: One-time construction that gates taro and later crops. Uses clay (requires jungle interior) as a natural progression gate. Doesn't consume fresh water — the well *is* the water source for farming. Fresh water jars remain expensive expedition fuel.

### Upgraded Building: Tended Garden (Tier 2, upgrades Cleared Plot)
- **Recipe**: `upgrade_tended_garden`
- **Skill**: Construction (level 7)
- **Inputs**: Flat stone ×4, bamboo cane ×4, cordage ×3, clay ×2
- **Required buildings**: Cleared plot, well
- **Required tool**: Digging stick
- **Building**: Upgrades an existing `cleared_plot` → `tended_garden`
- **Why**: In-place upgrade rather than a new building. Clay + well requirement = jungle interior discovered. Unlocks real crop cultivation. All stations that work on cleared plots also work on tended gardens.

### New Resource: Taro Corm
- **ID**: `taro_corm`
- **Name**: Taro Corm
- **Description**: "A starchy root cutting ready for planting. The staple crop of island life."

### How to Get Taro Corms
- **Expedition outcome**: Add to `sail_nearby_island` — "You find taro growing wild along a stream bank and dig up cuttings." → Drops taro corm ×2 (weight 12, requires nearby_island biome)
- **Why**: Ties farming to maritime progression — you need the raft to discover taro.

### New Station: Cultivate Taro
- **Station**: `cultivate_taro`
- **Skill**: Farming (level 5)
- **Required building**: Tended garden
- **Required building**: Well
- **Required tool**: Digging stick
- **Setup inputs**: Taro corm ×1
- **Duration**: 300 seconds (5 min)
- **Yields**:
  - Taro root ×2 (guaranteed)
  - Taro corm ×1 (60% chance — decent replanting rate)
  - Taro corm ×1 (15% additional — lucky harvest)
- **XP**: 25 farming XP
- **Max deployed**: Equal to number of tended gardens (or farm plots) owned
- **Why**: First real crop. ~75% expected corm return means you're mostly self-sustaining but occasionally need another expedition run. 5-minute timer makes offline returns meaningful.

### New Resource: Taro Root
- **ID**: `taro_root`
- **Name**: Taro Root
- **Description**: "A starchy, nutritious root. Must be cooked — raw taro is toxic."

### New Recipe: Cook Taro
- **Recipe**: `cook_taro`
- **Skill**: Cooking (level 5)
- **Inputs**: Taro root ×2, driftwood branch ×1
- **Output**: Cooked taro ×2
- **Required building**: Camp fire
- **XP**: 12 cooking XP

### New Resource: Cooked Taro
- **ID**: `cooked_taro`
- **Name**: Cooked Taro
- **Description**: "Boiled taro — starchy, filling, and the backbone of island meals."
- **Tags**: `["food"]`

### Farming Milestone: Seed Saving (Farming 8)
- **Effect**: "Seed saving — wild seed planting now always returns at least 1 seed"
- **Mechanic**: Guarantees 1 wild seed in `plant_wild_seeds` yield
- **Why**: At level 8 (still pre-dugout), the seed sink finally breaks even. Combined with level 7 (2 seed cost), you spend 2 and get 1 back guaranteed — a 50% loss, but with guaranteed food from root vegetables at this point. This is the RuneScape-style "level reward that changes the gameplay loop."

---

## Phase 4: Banana & Breadfruit (Farming 10-15, Post-Dugout)

### New Building: Farm Plot (Tier 3, upgrades Tended Garden)
- **Recipe**: `upgrade_farm_plot`
- **Skill**: Construction (level 10)
- **Inputs**: Flat stone ×6, clay ×6, bamboo cane ×4, cordage ×4
- **Required buildings**: Tended garden, firing pit
- **Required tool**: Digging stick
- **Building**: Upgrades an existing `tended_garden` → `farm_plot`
- **Why**: Top-tier plot. Firing pit requirement pushes it into late mid-game. All tended garden stations work here with improved yields.

### Banana (Farming 10)

#### New Resource: Banana Shoot
- **ID**: `banana_shoot`
- **Name**: Banana Shoot
- **Description**: "A banana plant cutting ready to establish in rich soil."
- **Source**: Dugout voyage expedition outcome — "You land on a lush islet and find banana plants growing wild. You carefully dig up a shoot." → banana shoot ×1 (weight 20)
- **Why**: Gives the dugout voyage its first real reward beyond the placeholder.

#### New Station: Grow Bananas
- **Station**: `grow_bananas`
- **Skill**: Farming (level 10)
- **Required building**: Farm plot
- **Required building**: Well
- **Required tool**: Digging stick
- **Setup inputs**: Banana shoot ×1
- **Duration**: 480 seconds (8 min)
- **Yields**:
  - Banana ×4 (guaranteed — high food yield)
  - Banana shoot ×1 (70% — bananas propagate readily)
- **XP**: 35 farming XP
- **Why**: Long timer but reliable yield. No cooking needed = unique among crops. The dugout gate means this is a genuine post-dugout farming upgrade. 8-minute timer rewards idle/offline play.

#### New Resource: Banana
- **ID**: `banana`
- **Name**: Banana
- **Description**: "A ripe banana. Sweet, filling, and needs no cooking."
- **Tags**: `["food"]`

### Breadfruit (Farming 12)

#### New Resource: Breadfruit Cutting
- **ID**: `breadfruit_cutting`
- **Name**: Breadfruit Cutting
- **Description**: "A breadfruit tree cutting. Needs rich soil and patient tending."
- **Source**: Dugout voyage outcome — "You discover a breadfruit grove on a distant island and take root cuttings." → breadfruit cutting ×1 (weight 12)

#### New Station: Grow Breadfruit
- **Station**: `grow_breadfruit`
- **Skill**: Farming (level 12)
- **Required building**: Farm plot
- **Required building**: Well
- **Required tool**: Digging stick
- **Setup inputs**: Breadfruit cutting ×1
- **Duration**: 600 seconds (10 min — longest crop timer)
- **Yields**:
  - Breadfruit ×5 (guaranteed — highest yield crop)
  - Breadfruit cutting ×1 (50% — harder to propagate)
- **XP**: 45 farming XP
- **Why**: Premium crop. Highest yield but longest wait and lowest replanting rate. 10-minute timer makes this the ultimate offline farming crop.

#### New Resource: Breadfruit
- **ID**: `breadfruit`
- **Name**: Breadfruit
- **Description**: "A large starchy fruit. Roast it for a hearty, filling meal."

#### New Recipe: Roast Breadfruit
- **Recipe**: `roast_breadfruit`
- **Skill**: Cooking (level 8)
- **Inputs**: Breadfruit ×1, driftwood branch ×2
- **Output**: Roasted breadfruit ×2 (cooks into 2 portions!)
- **Required building**: Camp fire
- **XP**: 18 cooking XP

#### New Resource: Roasted Breadfruit
- **ID**: `roasted_breadfruit`
- **Name**: Roasted Breadfruit
- **Description**: "Thick slices of fire-roasted breadfruit. Extremely filling."
- **Tags**: `["food"]`

---

## Phase 5: Late Farming Milestones (Farming 10-18)

| Level | Milestone | Effect |
|-------|-----------|--------|
| 10 | Green thumb — all crop stations 15% faster | Duration multiplier 0.85 on all farming stations |
| 12 | Propagation — all crop replanting chances +10% | Bonus to all corm/shoot/cutting return chances |
| 15 | Abundant harvest — 20% chance to double crop yields | Double output chance on all farming stations |
| 18 | Master farmer — wild seed planting yields 2 root vegetables guaranteed | Changes wild seed station to always drop 2 root vegetables |

---

## Phase 6: Voyage Provisions (Maritime Integration)

### New Recipe: Voyage Provisions
- **Recipe**: `pack_voyage_provisions`
- **Skill**: Preservation (level 8)
- **Inputs**: Any 15 food worth of items + sealed clay jar ×1
- **Output**: Voyage provisions ×1
- **Required building**: Firing pit
- **XP**: 25 preservation XP
- **Why**: Food-source agnostic — fishing, farming, or a mix all work. Farming is more *efficient* (bulk food from crops) but not *required*. A player who focused on fishing can pack cooked fish instead. This keeps farming as an optional efficiency play.

**Implementation note**: The "15 food" input is flexible. Simplest approach: require specific counts of any food-tagged resources (e.g., consume 15 items with the `food` tag + 1 sealed clay jar). The engine already tracks food-tagged items for expedition costs, so this pattern exists.

### New Resource: Voyage Provisions
- **ID**: `voyage_provisions`
- **Name**: Voyage Provisions
- **Description**: "Sealed jars of preserved food. Enough for a long sea voyage."
- **Tags**: `["food"]`
- **Special**: Counts as 8 food for expedition costs (one jar covers even expensive expeditions)

### Dugout Voyage Upgrades
Expand `dugout_voyage` from its current placeholder (single outcome, weight 1) to real content:
- Banana shoot discovery (mentioned above, weight 20)
- Breadfruit cutting discovery (mentioned above, weight 12)
- Obsidian deposits — "You find obsidian outcrops on a distant volcanic shore" → obsidian ×3 (weight 15)
- Resource haul — "You beach on a wooded island and gather materials" → large log ×1, bamboo cane ×3 (weight 20)
- Morale — "You watch the sunset from a pristine beach. The world feels vast and full of possibility." → morale +10 (weight 15)
- Empty — "Strong currents push you off course. You return tired but safe." (weight 18)
- **Food cost**: Increase to voyage provisions ×1 + fresh water ×2 (or keep as regular food + water if player hasn't made provisions yet — provisions are just more efficient)

---

## Farming Milestones Summary

| Level | Milestone |
|-------|-----------|
| 1 | Unlock: Plant Wild Seeds |
| 3 | Hardy seeds — +15% wild seed return |
| 5 | Careful planting — +15% root vegetable chance |
| 5 | Unlock: Cultivate Taro |
| 7 | Efficient sowing — wild seeds costs 2 instead of 3 |
| 8 | Seed saving — wild seeds always return ≥1 seed |
| 10 | Green thumb — all crops 15% faster |
| 10 | Unlock: Grow Bananas |
| 12 | Propagation — all replanting chances +10% |
| 12 | Unlock: Grow Breadfruit |
| 15 | Abundant harvest — 20% chance double yields |
| 18 | Master farmer — wild seeds yield 2 root vegetables guaranteed |

---

## New Content Summary

### Resources (10 new)

| Resource | Tags | Source |
|----------|------|--------|
| Root vegetable | food | Wild seed planting |
| Cooked root vegetable | food | Cook root vegetable |
| Taro corm | — | Raft expedition / taro harvest |
| Taro root | — | Taro cultivation |
| Cooked taro | food | Cook taro |
| Banana shoot | — | Dugout expedition |
| Banana | food | Banana cultivation |
| Breadfruit cutting | — | Dugout expedition |
| Breadfruit | — | Breadfruit cultivation |
| Roasted breadfruit | food | Cook breadfruit |
| Voyage provisions | food (×8) | Preservation recipe |

### Buildings (3 new, tier upgrade chain)

| Building | Tier | Max Count | Gate |
|----------|------|-----------|------|
| Cleared plot | 1 | 3 | Construction 3, digging stick |
| Tended garden | 2 | — (upgrade) | Construction 7, well, clay |
| Farm plot | 3 | — (upgrade) | Construction 10, firing pit |
| Well | — | 1 | Construction 6, clay |

### Tools (1 new)

| Tool | Gate |
|------|------|
| Digging stick | Crafting, camp fire |

### Stations (4 new)

| Station | Farming Lvl | Duration | Plot Tier |
|---------|-------------|----------|-----------|
| Plant wild seeds | 1 | 3 min | Cleared plot |
| Cultivate taro | 5 | 5 min | Tended garden |
| Grow bananas | 10 | 8 min | Farm plot |
| Grow breadfruit | 12 | 10 min | Farm plot |

### Recipes (4 new)

| Recipe | Skill | Gate |
|--------|-------|------|
| Cook root vegetable | Cooking 3 | Camp fire |
| Cook taro | Cooking 5 | Camp fire |
| Roast breadfruit | Cooking 8 | Camp fire |
| Pack voyage provisions | Preservation 8 | Firing pit, sealed jar |

### Expedition Outcomes (4 new)

| Expedition | Outcome | Weight |
|------------|---------|--------|
| Sail to Nearby Island | Taro corms ×2 | 12 |
| Voyage by Dugout | Banana shoot ×1 | 20 |
| Voyage by Dugout | Breadfruit cutting ×1 | 12 |
| Voyage by Dugout | (+ 3 more real outcomes) | various |

---

## Progression Flow

```
Foraging 9 (or Raft expedition)
  → Wild Seeds
    → Digging Stick (craft at camp fire)
      → Cleared Plot (build, Construction 3)
        → Plant Wild Seeds (3 min, consumes 3 seeds!)
          → Rough fiber, sometimes root vegetables, rarely seeds back
          → Farming XP → milestones gradually improve returns

Well (Construction 6, clay = jungle interior)
  → Unlocks watered farming

Raft → Nearby Island expedition
  → Taro Corms
    → Tended Garden (upgrade cleared plot, Construction 7)
      → Cultivate Taro (5 min, Farming 5)
        → Taro root → Cook → food for expeditions!
        → ~75% corm return → replant loop

Dugout → Voyage expedition (expanded with real outcomes)
  → Banana Shoots, Breadfruit Cuttings
    → Farm Plot (upgrade tended garden, Construction 10)
      → Grow Bananas (8 min, Farming 10)
      → Grow Breadfruit (10 min, Farming 12)
        → Best food sources in the game

Any food path (fishing OR farming OR both)
  → Voyage Provisions (15 food + sealed clay jar)
    → Powers longer dugout expeditions efficiently
    → Farming is more efficient but not required
```

---

## Implementation Order (suggested)

1. **Digging stick + cleared plot + well + wild seed station + root vegetable + cooking recipe**
   - Gets farming online as a skill with semi-idle loop
   - Wild seeds stop being a dead end
2. **Early farming milestones (levels 3, 5, 7, 8)**
   - Makes the grind feel rewarding as returns improve
3. **Tended garden upgrade + taro + cooking recipe + expedition outcome**
   - First real crop, ties to raft/maritime
4. **Farm plot upgrade + banana + breadfruit + cooking + dugout expedition overhaul**
   - Dugout becomes meaningful, late farming content
5. **Voyage provisions + late farming milestones (10, 12, 15, 18)**
   - Maritime integration, farming mastery

Each step is independently shippable and adds value.
