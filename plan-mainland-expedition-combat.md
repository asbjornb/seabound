# Mainland Expansion Spec — Expedition Combat, Loot, Mining & Smithing

## Vision

After the current outrigger expedition victory state, players can choose **Keep Playing** to enter an experimental mainland phase. This phase adds ARPG-inspired expedition combat and equipment planning while preserving SeaBound's survival/economy identity.

Mainland is a **sandbox extension**, not a replacement loop:
- Survival systems remain active and relevant.
- Combat, mining, smithing (and future magic) are **optional efficiency plays**.
- Mainline progression remains possible without specializing in these skills.

---

## Product Goals

1. Add high-agency expedition choices where gear meaningfully changes what content is possible.
2. Keep non-real-time gameplay: no twitch combat; outcomes are simulation/planning based.
3. Preserve pacing and identity: survival and settlement progression remain central.
4. Add long-tail replayability via loot/build experimentation and expedition mastery.
5. Ship safely behind clear experimental messaging and feedback collection.

---

## Entry & Player Messaging

### Current Win Screen Integration
- Keep existing victory screen unchanged.
- Add/update **Keep Playing** action behavior:
  - Show confirmation modal: mainland content is experimental and progress there may be reset/deleted.
  - Encourage player feedback via the existing form at page bottom.
  - Confirm action unlocks mainland systems and content flags.

### Experimental Safeguards
- Tag mainland saves with explicit experimental version marker.
- Allow future migration/reset policy without affecting pre-mainland island progression.

---

## Core Loop: Expedition-Based Combat

Combat remains embedded in expeditions as checks and events, not real-time encounters.

### Expedition Pool Structure
- Expeditions are always available from a pool.
- Each expedition has its own difficulty profile — gear checks, hazard types, and stat thresholds are per-expedition, not templated bands.
- Even early mainland expeditions require basic preparation: crafting a weapon (stone axe, fire-hardened spear, obsidian blade), basic armor (woven fiber, hide), or gathering supplies.
- Players progress by gearing up for specific expeditions, not by picking a generic risk tier. Like WoW dungeons — you can see the harder content exists, but you need to prepare before you can clear it.
- Progression is gear-gated: a fresh post-victory player will fail most expeditions until they craft baseline equipment from existing resources and new mainland materials.

### Run Outcome Loop
1. Choose expedition + route/loadout.
2. Resolve hazards, encounters, and survival checks.
3. Succeed/fail with partial/full rewards.
4. Improve via better planning, incremental drops, skill milestones, and repairs/crafting.
5. Retry previously failed content until mastered, then move upward.

### Failure Philosophy
- Failure should be instructive, not catastrophic.
- Partial rewards, strong logs, and visible "what would have helped" hints enable iterative planning.

---

## Gear & Build System (No Rarity Labels Yet)

No explicit "magic/rare" naming in v1. Instead, equipment quality/depth comes from affixes and uniques.

### Equipment Model
- Multiple loadout slots (limited on purpose).
- Gear provides:
  - Hazard mitigation (terrain/weather/environment).
  - Encounter modifiers (offense/defense/control-like effects in abstract simulation terms).
  - Utility effects (carry, endurance, recovery, etc.).

### Affix Design Direction
- ARPG-style affix families with bounded ranges.
- Effects are expedition-relevant first (unlocking viability), speed second.
- Affix combinations should encourage "build for expedition profile" decisions.

### Unique Items
- Low-frequency drops with identity-shaping effects.
- Should create alternative expedition strategies, not just bigger numbers.

### Item Lifecycle
- Find -> evaluate -> equip/repair/craft-improve -> outgrow -> recycle/salvage -> rediscover later niches.

---

## Smithing in an Affix Economy (Proposed Hybrid)

To resolve drop-vs-crafting tension, use a hybrid model that gives smithing strong relevance without invalidating drops.

### 1) Broken-Drop Repair Gate (Primary)
- Many higher-tier drops arrive **Damaged/Broken**.
- Item cannot be equipped until repaired.
- Repair requires:
  - Base metal/material components.
  - Optional catalyst components from expeditions.
  - Minimum smithing level.
- Result: drops stay exciting; smithing becomes a meaningful progression bridge.

### 2) Crafted Baseline Gear (Secondary)
- Smithing can produce stable, dependable gear per tier.
- Crafted gear is usually below top dropped ceilings but above average low-roll drops.
- Purpose: reduce RNG dead-ends and support build entry points.

### 3) Controlled Imbuement (Late Optional)
- Limited smithing recipe family can add or tune one affix within strict caps.
- Prefer deterministic or narrow-band outcomes over broad reroll gambling.
- Keeps identity: planning > slot-machine crafting.

### 4) Salvage & Material Return
- Unused gear can be salvaged for partial materials and affix reagents.
- Supports loop sustainability and item turnover.

---

## Mining & Smithing Progression (Historically Grounded)

Metals should follow a more realistic historic progression arc.

### Suggested Material Eras
1. Native copper / simple copper working
2. Arsenical/early bronze equivalents
3. Tin bronze stabilization
4. Early wrought iron / bloomery-style progression
5. Steel refinement (limited, costly, late)

### Design Notes
- Keep fantasy saturation low in base mainland loop.
- No other active human factions/NPC civilizations.
- Ancient/medieval ruins may exist as environmental remnants only.

---

## Skill Role & Balance

### Combat Skill
- Combat level should give **small milestone-style bonuses** only.
- Avoid making raw combat level the primary success determinant.
- Success should primarily derive from route choice, gear profile, supplies, and planning.

### Optionality Principle (Global)
- Mining, smithing, combat, and future magic are all optional efficiency levers.
- Players can ignore these and still progress through slower alternatives.
- Similar to existing food-economy tradeoffs (e.g., minimal farming/fishing is viable but inefficient).

---

## Logging, Journal, and Information UX

### Combat Logs
- Full detailed combat log generated per expedition run.
- Log is available at least once post-run.
- Player may delete/clear detailed log after viewing.

### Journal Entries
- Expedition history retained in journal as lower-detail summaries.
- Journal intended for long-term progression memory, not raw simulation dumps.

---

## UI/UX Scope for Complexity Control

Because game UI is already complex, phase rollout should minimize overwhelm.

### V1 UI Requirements
- Mainland toggle/section entry from post-victory flow.
- Expedition selection panel with clear risk/reward preview.
- Basic loadout screen (limited slots).
- Post-run results view with loot + failure causes.
- Inventory filtering/sorting for equipment and materials.

### Defer/Phase Later
- Deep comparison overlays.
- Large-scale stash management features.
- Advanced crafting planners.

---

## System Boundaries to Preserve Core Identity

1. Survival upkeep costs remain relevant in mainland expeditions.
2. Non-combat resource loops still matter for expedition readiness.
3. Expedition combat is one pillar among several, not the only dominant growth axis.
4. New systems should create cross-loop decisions, not replace the city-builder/survival sandbox.

---

## Technical Spec Sketch (Data/Rules)

### New Data Domains
- `equipment_items`
- `item_affixes`
- `item_uniques`
- `item_state` (e.g., broken, repaired)
- `expedition_encounters`
- `expedition_hazard_profiles`
- `repair_recipes`
- `salvage_tables`
- `smithing_recipes`
- `combat_logs`

### Resolution Pipeline (Per Expedition)
1. Build expedition context (hazards + encounters + route modifiers).
2. Build player profile (stats, supplies, loadout, milestone bonuses).
3. Resolve staged checks (survival -> encounter -> attrition -> outcome).
4. Generate outcomes (rewards, damage/condition changes, logs, journal summary).
5. Persist any broken/used/depleted item states.

---

## Release Strategy

### Phase A (Foundation)
- Post-victory mainland opt-in with experimental warning.
- Per-expedition difficulty profiles + simulated combat/gear checks.
- Minimal gear slots + starter affix pool.
- Logs + journal summary system.

### Phase B (Economy Integration)
- Mining + smithing skill introduction.
- Broken-drop repairs + crafted baseline gear.
- Salvage loop and material sinks.

### Phase C (Depth)
- Unique items.
- Expanded affix families and expedition archetypes.
- Limited imbuement system.

---

## Open Questions

1. Exact number of loadout slots for meaningful but readable choices.
2. How much broken-drop frequency feels satisfying vs frustrating per tier.
3. Whether imbuement should unlock before or after unique items.
4. Failure penalty tuning (resource loss, durability impact, time cost).
5. Inventory UX limits before needing stash redesign.

---

## Implementation To-Do List

## 0) Product Framing & Safety
- [ ] Define mainland feature flag and save-version marker.
- [ ] Add keep-playing warning modal copy (experimental progress may be deleted).
- [ ] Add in-modal feedback CTA pointing to existing bottom-page form.
- [ ] Define reset/migration policy for experimental mainland states.

## 1) Expedition Combat Framework
- [ ] Define per-expedition difficulty profiles (gear checks, hazard types, stat thresholds).
- [ ] Implement non-real-time encounter/hazard resolution skeleton.
- [ ] Add success/failure/partial reward outcome handling.
- [ ] Add failure insight messaging (what stats/gear would help).

## 2) Equipment & Affix Foundation
- [x] Define slot schema and loadout constraints.
- [x] Implement base equipment item structure.
- [x] Implement affix attachment and bounded roll ranges.
- [x] Add first pass of expedition-focused affix families.
- [ ] Add basic equipment sorting/filtering in inventory UI.

## 3) Logging & Journal
- [ ] Implement per-run detailed combat log generation.
- [ ] Add one-time prominent log presentation after expedition.
- [ ] Add player action to clear/delete detailed logs.
- [ ] Persist lower-detail expedition summaries in journal.

## 4) Mining & Smithing Foundations
- [ ] Define historical metal progression resource chain.
- [ ] Add mining skill milestones aligned to resource tiers.
- [ ] Add smithing skill milestones aligned to repair/crafting thresholds.
- [ ] Add baseline smithing recipes for dependable tier gear.

## 5) Broken Drop + Repair Loop
- [ ] Add item condition states including broken/damaged.
- [ ] Add expedition drop rules that can produce broken high-tier gear.
- [ ] Add repair recipe schema (materials + smithing level gates).
- [ ] Add repair UI flow and repair outcome messaging.

## 6) Salvage & Material Economy
- [ ] Add salvage action for unwanted gear.
- [ ] Add salvage tables returning partial base materials.
- [ ] Add affix reagent/catalyst outputs for long-loop crafting value.
- [ ] Tune sinks/sources to avoid material inflation.

## 7) Combat Skill Balance
- [ ] Define small milestone bonuses (not large linear stat scaling).
- [ ] Ensure combat skill contributes without eclipsing gear/planning choices.
- [ ] Validate optionality: content still completable via low-combat alternatives (slower paths).

## 8) UX Complexity Control
- [ ] Ship minimal expedition + loadout + results flow first.
- [ ] Defer advanced comparison/stash tooling to later milestone.
- [ ] Add readability improvements for large drop lists (grouping, collapse, filters).

## 9) Content Authoring
- [ ] Author initial mainland expedition set with clear profiles.
- [ ] Add low-tier repeatable expeditions with stage-relevant rare drops.
- [ ] Add high-risk expeditions with unique chase rewards.
- [ ] Ensure no active human factions; ruins/environmental storytelling only.

## 10) Validation & Telemetry
- [ ] Track expedition pick rates and failure rates by tier.
- [ ] Track repair bottlenecks and smithing engagement.
- [ ] Track log-open and log-clear behavior.
- [ ] Capture optionality metrics (players progressing with/without new skills).
- [ ] Add feedback review cadence for experimental iteration.
