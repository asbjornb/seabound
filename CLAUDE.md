# SeaBound

Crafting progression idle game — a tropical island castaway survival game inspired by RuneScape skill leveling, Minecraft crafting depth, and idle game offline progression. Mobile-first, web-based. Live at https://seabound.pages.dev

Tech: TypeScript, React 19, Vite 6. Run `npm run dev` to start, `npm run build` to type-check + bundle.

## Docs

- `GAME-REFERENCE.md` — Game balance reference: skills, actions, recipes, resources, buildings, biomes, progression flow
- `seabound-progression-v2.md` — Full progression design document with implementation status and mechanic specs
- `diary.md` — Development diary with session notes and design decisions

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

## Architecture Notes

- **Data-driven**: Game content is config objects in `src/data/`, not hardcoded in UI. To add content, add entries there.
- **State**: `useGame()` hook provides all game state and actions to components. State saved as JSON in localStorage with auto-migration.
- **Strict TS**: No unused locals/params, no implicit any. Build must pass `tsc` cleanly.
