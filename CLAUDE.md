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
    resources.ts  # Resource definitions
    skills.ts     # Skill definitions + XP formula
    buildings.ts  # Settlement buildings
    expeditions.ts # Expeditions + RNG outcomes
    milestones.ts # Skill level milestone effects
  engine/         # Game logic
    gameState.ts  # State shape, save/load, migrations
    useGame.ts    # Game controller hook (start actions, crafting, expeditions)
    tick.ts       # Frame update loop, progress, completions
  components/     # React UI panels (ActionPanel, CraftingPanel, SettlementPanel, etc.)
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
- **State**: `useGame()` hook provides all game state and actions to components. State saved as JSON in localStorage with auto-migration.
- **Strict TS**: No unused locals/params, no implicit any. Build must pass `tsc` cleanly.
