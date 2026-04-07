# Mainland Expedition Combat — Implementation Todo

Tracks progress on the [Mainland Expedition Combat Spec](plan-mainland-expedition-combat.md). Each section maps to the spec's numbered sections.

## 0) Product Framing & Safety
- [x] Add `mainlandUnlocked` flag to GameState + save migration
- [x] Add experimental warning modal on "Continue Playing" (VictoryScreen)
- [x] Define reset/migration policy for experimental mainland states
- [x] Add in-modal feedback CTA pointing to existing bottom-page form

## 1) Expedition Combat Framework
- [x] Define per-expedition difficulty profiles (gear checks, hazard types, stat thresholds)
- [x] Implement non-real-time encounter/hazard resolution skeleton
- [x] Add success/failure/partial reward outcome handling
- [x] Add failure insight messaging (what stats/gear would help)

## 2) Equipment & Affix Foundation
- [x] Define slot schema and loadout constraints
- [x] Implement base equipment item structure
- [x] Implement affix attachment and bounded roll ranges
- [x] Add first pass of expedition-focused affix families
- [x] Add basic equipment sorting/filtering in inventory UI

## 3) Logging & Journal
- [x] Implement per-run detailed combat log generation
- [x] Add one-time prominent log presentation after expedition
- [x] Add player action to clear/delete detailed logs
- [x] Persist lower-detail expedition summaries in journal

## 4) Mining & Smithing Foundations
- [x] Define historical metal progression resource chain
- [x] Add mining skill milestones aligned to resource tiers
- [x] Add smithing skill milestones aligned to repair/crafting thresholds
- [x] Add baseline smithing recipes for dependable tier gear

## 5) Broken Drop + Repair Loop
- [x] Add item condition states including broken/damaged
- [x] Add expedition drop rules that can produce broken high-tier gear
- [x] Add repair recipe schema (materials + smithing level gates)
- [x] Add repair UI flow and repair outcome messaging

## 6) Salvage & Material Economy
- [x] Add salvage action for unwanted gear
- [x] Add salvage tables returning partial base materials
- [x] Add affix reagent/catalyst outputs for long-loop crafting value
- [x] Tune sinks/sources to avoid material inflation

## 7) Combat Skill Balance
- [x] Define small milestone bonuses (not large linear stat scaling)
- [x] Ensure combat skill contributes without eclipsing gear/planning choices
- [x] Validate optionality: content still completable via low-combat alternatives

## 8) UX Complexity Control
- [x] Ship minimal expedition + loadout + results flow first
- [x] Defer advanced comparison/stash tooling to later milestone
- [x] Add readability improvements for large drop lists

## 9) Content Authoring
- [x] Author initial mainland expedition set with clear profiles
- [x] Add low-tier repeatable expeditions with stage-relevant rare drops
- [x] Add high-risk expeditions with unique chase rewards
- [x] Ensure no active human factions; ruins/environmental storytelling only

## 10) Validation & Telemetry
- [x] Track expedition pick rates and failure rates by tier
- [x] Track repair bottlenecks and smithing engagement
- [x] Track log-open and log-clear behavior
- [x] Capture optionality metrics (players progressing with/without new skills)
- [x] Add feedback review cadence for experimental iteration
