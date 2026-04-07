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
- [ ] Add one-time prominent log presentation after expedition
- [ ] Add player action to clear/delete detailed logs
- [ ] Persist lower-detail expedition summaries in journal

## 4) Mining & Smithing Foundations
- [ ] Define historical metal progression resource chain
- [ ] Add mining skill milestones aligned to resource tiers
- [ ] Add smithing skill milestones aligned to repair/crafting thresholds
- [ ] Add baseline smithing recipes for dependable tier gear

## 5) Broken Drop + Repair Loop
- [ ] Add item condition states including broken/damaged
- [ ] Add expedition drop rules that can produce broken high-tier gear
- [ ] Add repair recipe schema (materials + smithing level gates)
- [ ] Add repair UI flow and repair outcome messaging

## 6) Salvage & Material Economy
- [ ] Add salvage action for unwanted gear
- [ ] Add salvage tables returning partial base materials
- [ ] Add affix reagent/catalyst outputs for long-loop crafting value
- [ ] Tune sinks/sources to avoid material inflation

## 7) Combat Skill Balance
- [ ] Define small milestone bonuses (not large linear stat scaling)
- [ ] Ensure combat skill contributes without eclipsing gear/planning choices
- [ ] Validate optionality: content still completable via low-combat alternatives

## 8) UX Complexity Control
- [ ] Ship minimal expedition + loadout + results flow first
- [ ] Defer advanced comparison/stash tooling to later milestone
- [ ] Add readability improvements for large drop lists

## 9) Content Authoring
- [ ] Author initial mainland expedition set with clear profiles
- [ ] Add low-tier repeatable expeditions with stage-relevant rare drops
- [ ] Add high-risk expeditions with unique chase rewards
- [ ] Ensure no active human factions; ruins/environmental storytelling only

## 10) Validation & Telemetry
- [ ] Track expedition pick rates and failure rates by tier
- [ ] Track repair bottlenecks and smithing engagement
- [ ] Track log-open and log-clear behavior
- [ ] Capture optionality metrics (players progressing with/without new skills)
- [ ] Add feedback review cadence for experimental iteration
