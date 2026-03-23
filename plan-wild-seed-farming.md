# Wild Seed Farming Progression Plan

## Overview

A complete farming system starting from wild seeds, using the existing **station** (set-wait-collect) pattern for the semi-idle plant→wait→harvest loop. Farming begins as a wild seed sink in mid-game, grows into a self-sustaining food economy, and optionally feeds into maritime progression via preserved voyage provisions.

---

## Phase 1: Digging Stick & First Plot (Entry Gate)

### New Tool: Digging Stick
- **Recipe**: `craft_digging_stick`
- **Skill**: Crafting
- **Inputs**: Bamboo cane ×1, flat stone ×1 (fire-harden at camp fire)
- **Required**: Camp fire (fire-hardening)
- **One-time craft**
- **Why**: Gates all farming. Cheap to craft once you have fire, but not free — you need the bamboo/stone/fire chain first.

### New Building: Cleared Plot
- **Recipe**: `build_cleared_plot`
- **Skill**: Construction (level 5)
- **Inputs**: Flat stone ×2, driftwood branch ×2, dry grass ×3
- **Required tool**: Digging stick
- **Building**: `cleared_plot`
- **Stackable**: `maxCount: 3` (player can build up to 3 plots)
- **Why**: Single crop slot. Costs are modest but not trivial — the flat stone and driftwood compete with other recipes. Multiple plots = more investment but more yield.

---

## Phase 2: Wild Planting (Farming Skill Bootstrap)

### New Station: Plant Wild Seeds
- **Station**: `plant_wild_seeds`
- **Skill**: Farming (level 1)
- **Required building**: Cleared plot
- **Required tool**: Digging stick
- **Setup inputs**: Wild seed ×2 (consumed on planting)
- **Duration**: 90 seconds (1.5 min — short enough to feel rewarding early)
- **Yields**:
  - Dry grass ×3 (guaranteed — weedy crops)
  - Wild seed ×1 (50% chance — sometimes you get a seed back, sometimes you don't)
  - Root vegetable ×1 (30% chance — occasional useful food find)
- **XP**: 15 farming XP
- **Max deployed**: Equal to number of cleared plots owned (effectively 1 per plot)
- **Why**: This is the **seed sink**. You spend 2 wild seeds and on average get ~0.5 back. Players must keep foraging (Foraging 9 milestone) or running Nearby Island expeditions to sustain planting. The dry grass yield is useful (fire fuel, camp fire recipe) so it's never a total waste. The rare root vegetable teases the food potential of farming.

### New Resource: Root Vegetable
- **ID**: `root_vegetable`
- **Name**: Root Vegetable
- **Description**: "A knobby tuber dug up from the wild planting. Edible raw, better cooked."
- **Tags**: `["food"]`
- **Why**: First farming food output. Raw it's just food; later it can be cooked for better value.

### New Recipe: Cook Root Vegetable
- **Recipe**: `cook_root_vegetable`
- **Skill**: Cooking (level 3)
- **Inputs**: Root vegetable ×1, driftwood branch ×1, dry grass ×1 (removed by stone hearth)
- **Output**: Cooked root vegetable ×1
- **Required building**: Camp fire
- **Tags on output**: `["food"]`
- **XP**: 8 cooking XP
- **Why**: Gives farming output a cooking sink, creates a cross-skill loop.

### New Resource: Cooked Root Vegetable
- **ID**: `cooked_root_vegetable`
- **Name**: Cooked Root Vegetable
- **Description**: "A fire-roasted tuber. Filling and surprisingly tasty."
- **Tags**: `["food"]`

---

## Phase 3: Tended Garden & Taro Cultivation (Farming 5)

### New Building: Tended Garden
- **Recipe**: `build_tended_garden`
- **Skill**: Construction (level 8)
- **Inputs**: Flat stone ×4, bamboo cane ×4, cordage ×3, clay ×2
- **Required building**: Cleared plot
- **Required tool**: Digging stick
- **Building**: `tended_garden`
- **Max count**: 2
- **Why**: Upgraded plot. Clay requirement means you need jungle interior discovered. Unlocks actual crop cultivation with better yields.

### New Resource: Taro Corm
- **ID**: `taro_corm`
- **Name**: Taro Corm
- **Description**: "A starchy root cutting ready for planting. The staple crop of island life."
- **Tags**: (none — it's a planting material, not food)

### How to Get Taro Corms
- **Expedition outcome**: Add to `sail_nearby_island` — "You find taro growing wild along a stream bank and dig up cuttings." → Drops taro corm ×2 (weight 12, requires nearby_island biome)
- **Why**: Ties farming to maritime progression — you need the raft to discover taro.

### New Station: Cultivate Taro
- **Station**: `cultivate_taro`
- **Skill**: Farming (level 5)
- **Required building**: Tended garden
- **Required tool**: Digging stick
- **Setup inputs**: Taro corm ×1, fresh water ×1
- **Duration**: 180 seconds (3 min)
- **Yields**:
  - Taro root ×2 (guaranteed)
  - Taro corm ×1 (60% chance — decent replanting rate)
  - Taro corm ×1 (20% additional — lucky harvest)
- **XP**: 25 farming XP
- **Max deployed**: Equal to tended gardens owned
- **Why**: First real crop. ~80% expected corm return means you're almost self-sustaining but still occasionally need to expedition for more. Taro root is a solid food source.

### New Resource: Taro Root
- **ID**: `taro_root`
- **Name**: Taro Root
- **Description**: "A starchy, nutritious root. Must be cooked — raw taro is toxic."
- **Tags**: (none — must be cooked to become food)

### New Recipe: Cook Taro
- **Recipe**: `cook_taro`
- **Skill**: Cooking (level 5)
- **Inputs**: Taro root ×1, fresh water ×1, driftwood branch ×1
- **Output**: Cooked taro ×1
- **Required building**: Camp fire
- **XP**: 12 cooking XP
- **Why**: Water requirement adds another resource dependency. Creates strong loop: expedition → taro corm → plant → harvest → cook → food for more expeditions.

### New Resource: Cooked Taro
- **ID**: `cooked_taro`
- **Name**: Cooked Taro
- **Description**: "Boiled taro — starchy, filling, and the backbone of island meals."
- **Tags**: `["food"]`

---

## Phase 4: Banana & Breadfruit (Farming 8-10)

### Banana (Farming 8)

#### New Resource: Banana Shoot
- **ID**: `banana_shoot`
- **Description**: "A banana plant cutting ready to establish in rich soil."
- **Source**: Dugout voyage expedition outcome (new) — "You land on a lush islet and find banana plants growing wild. You carefully dig up a shoot." → banana shoot ×1 (weight 15)
- **Why**: Ties to dugout progression — gives the dugout voyage its first real reward beyond the placeholder.

#### New Station: Grow Bananas
- **Station**: `grow_bananas`
- **Skill**: Farming (level 8)
- **Required building**: Tended garden
- **Required tool**: Digging stick
- **Setup inputs**: Banana shoot ×1, fresh water ×1
- **Duration**: 240 seconds (4 min)
- **Yields**:
  - Banana ×3 (guaranteed)
  - Banana shoot ×1 (70% — bananas propagate readily)
- **XP**: 30 farming XP
- **Why**: High food yield, good replanting rate. Bananas are the "set it and forget it" crop — long timer but reliable. The dugout gate means this is a genuine late-game farming upgrade.

#### New Resource: Banana
- **ID**: `banana`
- **Name**: Banana
- **Description**: "A ripe banana. Sweet, filling, and needs no cooking."
- **Tags**: `["food"]`
- **Why**: No cooking needed = unique among crops. Good expedition food since it's ready to eat.

### Breadfruit (Farming 10)

#### New Resource: Breadfruit Cutting
- **ID**: `breadfruit_cutting`
- **Description**: "A breadfruit tree cutting. Needs rich soil and patient tending."
- **Source**: Dugout voyage outcome — "You discover a breadfruit grove on a distant island and take root cuttings." → breadfruit cutting ×1 (weight 10)

#### New Station: Grow Breadfruit
- **Station**: `grow_breadfruit`
- **Skill**: Farming (level 10)
- **Required building**: Tended garden
- **Required tool**: Digging stick
- **Setup inputs**: Breadfruit cutting ×1, fresh water ×2
- **Duration**: 360 seconds (6 min — longest crop timer)
- **Yields**:
  - Breadfruit ×4 (guaranteed — high yield)
  - Breadfruit cutting ×1 (50% — needs more tending to propagate)
- **XP**: 40 farming XP
- **Why**: Highest yield crop but longest wait and lowest replanting rate. The premium crop.

#### New Resource: Breadfruit
- **ID**: `breadfruit`
- **Name**: Breadfruit
- **Description**: "A large starchy fruit. Roast it for a hearty, filling meal."
- **Tags**: (none — must be cooked)

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

## Phase 5: Seed Saving & Farm Plot (Farming 15-20)

### New Building: Farm Plot
- **Recipe**: `build_farm_plot`
- **Skill**: Construction (level 12)
- **Inputs**: Flat stone ×6, clay ×6, bamboo cane ×6, cordage ×4
- **Required buildings**: Tended garden, firing pit
- **Required tool**: Digging stick
- **Building**: `farm_plot`
- **Max count**: 3
- **Why**: Top-tier farming building. Clay + firing pit requirement pushes it into late mid-game.

### Farming Milestone: Seed Saving (Farming 15)
- **Effect**: "Seed saving — wild seed planting now always returns at least 1 seed"
- **Mechanic**: Changes `plant_wild_seeds` station to guarantee 1 wild seed return (removes the seed-sink problem, rewards persistence)
- **Why**: The big farming payoff — you've invested enough that seeds become self-sustaining. This is the RuneScape-style "level reward that changes the gameplay loop."

### Farming Milestone: Green Thumb (Farming 10)
- **Effect**: "Green thumb — all crop stations 15% faster"
- **Mechanic**: Duration multiplier on all farming stations

### Farming Milestone: Bountiful Harvest (Farming 20)
- **Effect**: "Bountiful harvest — 25% chance to double crop yields"
- **Mechanic**: Double output chance on all farming stations

### New Station: Cultivate Taro (Farm Plot upgrade)
- **Station**: `cultivate_taro_advanced`
- **Skill**: Farming (level 15)
- **Required building**: Farm plot
- **Setup inputs**: Taro corm ×1
- **Duration**: 150 seconds (faster, no water needed)
- **Yields**:
  - Taro root ×3 (more yield)
  - Taro corm ×1 (80% — better propagation)
  - Taro corm ×1 (30% additional)
- **XP**: 30 farming XP
- **Why**: Direct upgrade to basic taro — farm plots are better in every way.

---

## Phase 6: Voyage Provisions (Maritime Integration)

### New Recipe: Preserved Provisions
- **Recipe**: `preserve_provisions`
- **Skill**: Preservation (level 10)
- **Inputs**: Cooked taro ×2, banana ×2, sealed clay jar ×1
- **Output**: Voyage provisions ×1
- **Required building**: Firing pit
- **XP**: 25 preservation XP
- **Why**: Combines farming output with pottery chain into a high-value expedition supply.

### New Resource: Voyage Provisions
- **ID**: `voyage_provisions`
- **Name**: Voyage Provisions
- **Description**: "Sealed jars of preserved food. Enough for a long sea voyage."
- **Tags**: `["food"]`
- **Special**: Counts as 5 food for expedition costs (a single jar covers most expeditions)
- **Why**: Creates the full loop: farming → cooking → preservation → maritime exploration. This is the payoff for the farming→pottery→maritime convergence.

### Dugout Voyage Upgrades
Add real outcomes to `dugout_voyage` that require voyage provisions:
- Banana shoot discovery (mentioned above)
- Breadfruit cutting discovery (mentioned above)
- "You reach a distant atoll and trade provisions with islanders" → unique resources/morale
- These give the dugout actual purpose and tie farming directly to end-game exploration

---

## Farming Milestones Summary

| Level | Milestone |
|-------|-----------|
| 1 | Unlock: Plant Wild Seeds |
| 5 | Unlock: Cultivate Taro |
| 8 | Unlock: Grow Bananas |
| 10 | Green thumb — all crops 15% faster |
| 10 | Unlock: Grow Breadfruit |
| 15 | Seed saving — wild seeds always return ≥1 seed |
| 15 | Unlock: Advanced Taro (farm plot) |
| 20 | Bountiful harvest — 25% chance double yields |

---

## New Resources Summary

| Resource | Tags | Source |
|----------|------|--------|
| Root vegetable | food | Wild seed planting |
| Cooked root vegetable | food | Cook root vegetable |
| Taro corm | — | Expedition / harvest |
| Taro root | — | Taro cultivation |
| Cooked taro | food | Cook taro |
| Banana shoot | — | Dugout expedition |
| Banana | food | Banana cultivation |
| Breadfruit cutting | — | Dugout expedition |
| Breadfruit | — | Breadfruit cultivation |
| Roasted breadfruit | food | Cook breadfruit |
| Voyage provisions | food | Preservation recipe |

---

## New Buildings Summary

| Building | Max Count | Gate |
|----------|-----------|------|
| Cleared plot | 3 | Construction 5, digging stick |
| Tended garden | 2 | Construction 8, cleared plot, clay |
| Farm plot | 3 | Construction 12, tended garden, firing pit |

---

## New Tools Summary

| Tool | Gate |
|------|------|
| Digging stick | Crafting, camp fire (fire-hardening) |

---

## Progression Flow

```
Foraging 9 (or Raft expedition)
  → Wild Seeds
    → Digging Stick (craft)
      → Cleared Plot (build, Construction 5)
        → Plant Wild Seeds (semi-idle, consumes seeds!)
          → Root vegetables, dry grass, maybe seeds back
          → Farming XP!

Raft → Nearby Island expedition
  → Taro Corms
    → Tended Garden (build, Construction 8, clay)
      → Cultivate Taro (semi-idle, Farming 5)
        → Taro root → Cook → food for expeditions!
        → Sometimes get corms back → replant loop

Dugout → Voyage expedition
  → Banana Shoots, Breadfruit Cuttings
    → Grow Bananas (Farming 8), Grow Breadfruit (Farming 10)
      → Best food sources in the game
      → Farm Plot (Construction 12) → advanced versions

Farming + Pottery + Preservation
  → Voyage Provisions (sealed jar + cooked crops)
    → Powers longer dugout expeditions
    → Full circle: farming enables exploration enables new crops
```

---

## Key Design Principles

1. **Wild seeds are a SINK early on** — you spend 2, get back ~0.5 on average. Forces continued foraging/expeditions until Farming 15.
2. **Semi-idle via stations** — reuses the existing basket trap pattern. Plant → wait → collect. No new engine mechanics needed.
3. **Cross-skill loops** — Farming needs Construction (plots), Cooking (processing), Preservation (provisions), Navigation (finding crops via expeditions).
4. **Maritime integration** — Raft gives taro, Dugout gives bananas/breadfruit. Farming output feeds back into expedition food supply.
5. **Gradual self-sufficiency** — Early farming is resource-negative (seed sink). Mid farming breaks even. Late farming is resource-positive (seed saving + bountiful harvest).
6. **Multiple plots = multiplied investment** — Building more plots costs resources but lets you run more stations simultaneously. Classic idle game scaling.

---

## Implementation Order (suggested)

1. Digging stick tool + cleared plot building + wild seed station + root vegetable + cooking recipe
2. Tended garden + taro corm + taro station + cooking recipe + expedition outcome
3. Farming milestones (Green Thumb, Seed Saving, Bountiful Harvest)
4. Farm plot building + advanced taro station
5. Banana + breadfruit (dugout expedition outcomes + stations + cooking)
6. Voyage provisions recipe + dugout expedition upgrades

Each step is independently shippable and adds value.
