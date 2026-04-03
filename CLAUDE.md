# SeaBound

Crafting progression idle game — a tropical island castaway survival game inspired by RuneScape skill leveling, Minecraft crafting depth, and idle game offline progression. Mobile-first, web-based. Live at https://seabound.dev (also served via https://seabound.pages.dev)

This is a single-playthrough game — there is no prestige, rebirth, or reset loop. The player progresses through one continuous run from castaway to thriving settlement. Challenge modes may be added in the future, but the core design has no repeating reset cycle.

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

## Icon Pipeline

Icons live in `public/icons/` as 256×256 RGBA PNGs with transparent backgrounds. They are loaded by convention — `GameIcon` renders `/icons/${id}.png` where `id` matches the resource/building/skill/biome/UI element ID.

### Processing new icons

New icons typically arrive as zip files (from image generation tools) containing `images/*.png` at 1024×1024 with solid-color backgrounds. To process them:

1. **Extract** the zip to a temp directory
2. **Remove backgrounds** using `rembg` (AI-based background removal)
3. **Crop** to the bounding box of non-transparent content
4. **Resize** to fit within 80% of 256×256 (leaving ~10% margin on each side), maintaining aspect ratio
5. **Center** on a transparent 256×256 canvas
6. **Save** to `public/icons/<id>.png`

```bash
pip install "rembg[cpu]" Pillow
```

```python
from PIL import Image
from rembg import remove

img = remove(Image.open("source.png").convert("RGBA"))
bbox = img.getbbox()
cropped = img.crop(bbox)
content_size = int(256 * 0.80)  # 204px — leaves 10% margin each side
scale = min(content_size / cropped.width, content_size / cropped.height)
resized = cropped.resize((int(cropped.width * scale), int(cropped.height * scale)), Image.LANCZOS)
canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
canvas.paste(resized, ((256 - resized.width) // 2, (256 - resized.height) // 2), resized)
canvas.save("public/icons/<id>.png")
```

No code changes are needed to wire up new icons — just ensure the filename matches the ID used in `src/data/` (resources, buildings, skills, etc.).

## GitHub Repository Secrets

Available as GitHub Actions secrets for CI/CD and deployments:

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API access |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Pages deployment |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages deployment |
| `SEABOUND_API_KEY` | Seabound backend API key |
| `SEABOUND_WORKER_URL` | Seabound Cloudflare Worker URL |
