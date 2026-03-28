# SeaBound

Crafting progression idle game — a tropical island castaway survival game inspired by RuneScape skill leveling, Minecraft crafting depth, and idle game offline progression. Mobile-first, web-based. Live at https://seabound.pages.dev

Tech: TypeScript, React 19, Vite 6. Run `npm run dev` to start, `npm run build` to type-check + bundle.

## Docs

- `seabound-progression-v2.md` — Full progression design document with implementation status and mechanic specs

## Key Paths

```
src/
  data/           # Game content definitions (data-driven design)
    types.ts      # All TypeScript interfaces & enums (ResourceId, SkillId, etc.)
    actions.ts    # Gathering actions
    recipes.ts    # Crafting/building recipes
    resources.ts  # Resource definitions (includes foodValue/waterValue)
    skills.ts     # Skill definitions + XP formula
    buildings.ts  # Settlement buildings (includes vesselTier)
    biomes.ts     # Biome definitions (name, order, startingBiome)
    phases.ts     # Game phase definitions (conditions that trigger each phase)
    expeditions.ts # Expeditions + RNG outcomes
    milestones.ts # Skill level milestone effects (including station effects)
    stations.ts   # Passive set-wait-collect stations
    registry.ts   # Central data registry — all engine/UI reads from here
    modding.ts    # Mod export, import, validation, storage (IndexedDB)
    registries.ts # Deprecated — proxy shim over registry.ts
  engine/         # Game logic
    gameState.ts  # State shape, save/load, migrations, per-mod save keys
    useGame.ts    # Game controller hook (start actions, crafting, expeditions)
    tick.ts       # Frame update loop, progress, completions
    phases.ts     # Phase detection (reads from data registry)
  components/     # React UI panels (ActionPanel, CraftingPanel, SettlementPanel, etc.)
    ModPanel.tsx  # Mod management UI (import/export/activate/delete)
  App.tsx         # Main app: tabs, layout, settings
  App.css         # All styles (mobile-first, tropical theme)
```

## Progression Graph Tool

A dependency graph of all game content — resources, actions, recipes, buildings, biomes, skill levels, expeditions, stations — with pre-computed analysis.

### Files

- `scripts/build-graph.ts` — Extracts graph from `src/data/*`, runs analysis, writes JSON
- `src/data/progression-graph.json` — Committed artifact (always check in after data changes)
- `src/components/DevGraph.tsx` — Interactive D3 visualization at `?dev=graph`

### Usage

```bash
npx tsx scripts/build-graph.ts          # regenerate JSON
npx tsx scripts/build-graph.ts --check  # CI: exit 1 if stale
```

### Querying the graph (for agents)

Read `src/data/progression-graph.json` directly. Key paths:

- `analysis.criticalPathToDugout` — all nodes in the upstream dependency tree to `resource:dugout`
- `analysis.deadEnds` — resources produced but never consumed
- `analysis.unreachable` — nodes not reachable from beach start (should be empty)
- `analysis.warnings` — array of `{ type, nodeId, message }` for dead ends, unreachable, high gates, no-training skills
- `analysis.skillGates.<skillId>` — per-skill: level gates, what they unlock, what trains them
- `analysis.biomeProgression.tiers` — biome unlock order with gating info

### Dev Wiki

- `?dev` — Tables of all game content (auto-generated from data files)
- `?dev=graph` — Interactive progression graph with filters

## Architecture Notes

- **Data-driven**: Game content is config objects in `src/data/`, not hardcoded in UI. To add content, add entries there.
- **Registry pattern**: All engine and component code reads game data through `src/data/registry.ts` (via `getResources()`, `getActionById()`, etc.), never by importing data files directly. This enables the mod system to swap data at runtime.
- **State**: `useGame()` hook provides all game state and actions to components. State saved as JSON in localStorage with auto-migration. Saves are namespaced by mod ID.
- **ID types**: `ResourceId`, `SkillId`, `BiomeId`, etc. are `string` aliases (not literal unions), so mods can introduce arbitrary new IDs.
- **Strict TS**: No unused locals/params, no implicit any. Build must pass `tsc` cleanly.

## Mod System

The game is fully moddable. All game content flows through a `GameDataPack` in the registry.

- **Export**: Settings → Mods → "Export current data pack" downloads a .zip with data.json + icons/
- **Import**: Upload a .zip (data + icons) or legacy .json; validation checks all cross-references
- **Storage**: Mod packs stored in IndexedDB; icons stored separately in IndexedDB; each mod gets its own localStorage save
- **Switching**: Activate/deactivate mods from the Mods panel; mod icons loaded into memory as object URLs on switch

### Creating a mod

1. Export the base game data pack (.zip with data.json + icons/)
2. Edit data.json — change the `id` field, add/modify resources, recipes, actions, skills, etc.
3. Add or replace PNGs in the icons/ folder for custom artwork
4. Import the modified .zip (or plain .json without icons); validation errors/warnings shown inline
5. Activate the mod to play with it

### What's moddable

Everything in the data pack: resources (with food/water values), tools, skills, buildings (with vessel tiers, storage bonuses), biomes, phases (with trigger conditions), actions, recipes (with hideWhen rules), expeditions, stations, milestones.

### Not yet moddable

- **Progression graph**: `build-graph.ts` reads static files; doesn't run against loaded mods yet.
