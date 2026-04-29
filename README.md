# SeaBound

**[Play now at seabound.pages.dev](https://seabound.pages.dev)**

A crafting progression idle game. Mobile-first, web-based.

Choose an action, watch the progress bar fill, collect resources, level up skills, unlock new recipes and areas, build your settlement from a campfire into a thriving settlement and explore the surroundings.

Unlike many such survival craft games early progression takes place on a tropical island start so early tech is bamboo focused, weaving baskets, foraging for coconuts and tidewater pool fishing, building shade. Later the player can explore nearby islands to get access to obsidian for better early game tools.

The first arc ends with an outrigger canoe and an oceanic voyage that lands the castaway on the mainland. From there an experimental post-victory phase opens up: mining, smithing (copper → bronze → iron → steel), equipment with affixes and uniques, and turn-based expedition combat.

## Core Gameplay Loop

1. **Choose an action** — collect coconuts, harvest bamboo, fish, craft, explore
2. **Wait for progress** — actions run automatically on a timer and repeat until changed
3. **Gain resources and skill XP** — inventory fills with drops, skills level up
4. **Unlock new content** — higher skill levels unlock rare drops, faster actions, new recipes, and related activities
5. **Craft tools and build infrastructure** — expand your settlement with new workstations and buildings
6. **Repeat** — deeper systems open up as you progress

This is a progress bar / idle progression game, not a real-time survival game. The interface is panels, progress bars, resource counters, and action buttons — not a graphical world.

The game supports offline progress — actions continue while the player is away and resources and experience accumulate when they return.

## Inspirations

- **RuneScape** — skill leveling, skilling actions, progression unlocks
- **Minecraft (modded)** — crafting depth, resource chains, inventory management
- **Vintage Story / TerraFirmaCraft** — expanded early game, primitive technology progression
- **Idle games** — automatic actions, offline progress, incremental rewards
- **Farmville** — settlement building, tending crops, checking back in

## Gathering and Skills

Each gathering action (fishing, foraging, etc.) has an associated skill. As skill levels increase:

- New rare drops become available
- Action speed increases
- Drop chances improve for rare items
- New recipes unlock
- Related actions unlock (e.g. high fishing unlocks fish trapping)

## Exploration

Exploration is an expedition-style action that takes time to complete. Costs food and water and as such is the main reason to gather and store those. Some exploration actions might require more food or preserved food to go longer. Some might require a basic raft, canoe or sail boat.

Exploration can return:

- Random resources from loot tables
- Rare items
- New biomes containing new materials and actions

Discovering a biome permanently unlocks new gathering options. First one might be bamboo grove unlocking harvesting bamboos and thus related crafts.

Some areas may be gated by combat strength, required consumables (food), or skill levels. Food is not required to survive — there is no way to die — but it may be a necessary consumable for actions like exploring.

## Settlement Building

As the player progresses, the camp gradually grows into a small settlement. New buildings unlock new systems:

- **Campfire / Stone Hearth** — cooking, warmth, fire-hardened tools
- **Firing Pit → Kiln → Bloomery** — pottery, crucibles, smelting and iron-smelting
- **Pottery Wheel, Charcoal Kiln, Cartographer's Table** — specialized production stations
- **Farms** — cleared plot → tended garden → farm plot, plus pandanus grove
- **Maritime** — bamboo raft → dugout canoe → outrigger canoe (the way home)
- **Comfort tier** — sleeping mat → hammock → thatched hut (slows morale decay)
- **Storage buildings** — palm leaf pile, woven baskets, log rack, storage shelf, clay storage jars

## Early Game Progression

The early game focuses on primitive technology and bootstrapping basic infrastructure on a tropical island start:

- **Foraging** -- Gather coconuts, shells, fruit.
- **Fishing** -- Wade tidewater, spear fish, set fish traps, set nets
- **Fiber gathering** — collect grass, plant fibers for cordage
- **Stone knapping** — shape rocks into basic cutting tools
- **Woodcutting** — gather sticks, branches, logs
- **Basic crafting** — bamboo tools, fishing equipment, simple traps, stone tools, crude axes, baskets
- **Fire-making** — build campfires, fireplaces
- **Clay work** — dig clay, shape pots, build firing pits and simple kilns
- **Drying and curing** — dry racks for preserving meat and hides or drying plant fiber
- **Inventory management** — craft storage like baskets, wood piles, chests
- **Farming** — clear ground, plant seeds, tend crops for a stable food supply

## Example Gameplay

You start on a deserted beach with nothing but your hands.

You begin foraging to gather coconuts and shells. You use coconuts to gather rain water and wade tidal pools for fish and clams. You start a fire and cook some fish.
With some food and water you start exploring and find a bamboo grove which unlocks lots of new technology.

Soon you are building shelter, weaving baskets and transplanting fruit trees.

Over time your camp grows into a small settlement with workshops, farms, and specialized production. Eventually you fit out an outrigger canoe and sail for the mainland, where an experimental post-victory phase opens up combat, mining, and metalworking.

## Mainland Phase (post-victory, experimental)

After completing the Oceanic Voyage, players can opt into a mainland sandbox that adds:

- **Mining** — copper, tin, and iron deposits in coastal cliffs and inland hills
- **Smithing** — full historical metal progression: copper → bronze → iron → steel
- **Equipment with affixes** — weapons, armor, shields, trinkets across four tiers, with rolled affix bonuses, item conditions (broken / damaged / worn / pristine), repair, salvage, and one-shot imbuement from rare expedition reagents
- **Turn-based expedition combat** — multi-stage encounters resolved as round-by-round simulations (no twitch). Player vs enemy HP exchanges with typed damage (physical, heat, cold, wet) and resists. Win-rate previews via Monte Carlo so you can plan loadouts before committing
- **Mainland expeditions** — coastal ruins, tidal caves, overgrown trails, flooded quarry, windswept ridge, sunken temple, volcanic rift. Each has a unique chase reward and an exclusive imbuement reagent
- **Cartographer's Table** — non-combat path to discover mainland mining biomes via slow charting sessions, for players who don't want to fight

## Design Goals

- **Single playthrough** — no prestige, rebirth, or reset loops; one continuous run from castaway to thriving settlement (challenge modes may come later, but no repeating reset cycle)
- **Sandbox progression** — content unlocks in broad waves rather than a strict linear path; at any point the player has multiple valid things to pursue (better food, new tools, exploration, building) — like Minecraft, the fun is in choosing your own priorities
- Focus on satisfying progression
- No artificial waiting or pay-to-skip mechanics
- Deep crafting and resource chains
- A world that grows with the player
- Systems that unlock gradually and interconnect over time
- A sandbox endgame where players show off found and crafted gear or cool modular automations

## What's Built

- Gathering actions with progress timers and offline progress
- Crafting and building recipes (130+) across 12 skills
- Six island phases (Bare Hands → Bamboo → Fire → Stone & Clay → Maritime → Voyage) plus the post-victory mainland sandbox
- Skill leveling with hand-authored milestones (speed, drop chances, double output, combat stat bonuses)
- Expedition system — 5 island expeditions for biome discovery, 7 mainland expeditions with multi-stage combat
- Settlement with 29 buildings (cooking, storage, comfort, processing, farming, maritime, mainland)
- Routines — chain 2+ actions into repeating sequences, unlocked at any skill level 15
- Equipment & affix system — 4 gear tiers (improvised → copper → bronze → iron → steel), 25+ affix families, repair, salvage, imbuement
- Mod system — full game data is exportable/importable as a `.zip` data pack with custom icons

## Future Ideas

- Magic / supernatural systems hinted at in the mainland phase
- Automation / NPC helpers for late-game stations
- Distant archipelago expedition tier with rarer affix pools

## Tech

Mobile-first, web-based. Designed for quick link sharing and fast iteration.
