# SeaBound Icon Specification

Complete specification for all game icons. Currently the game uses Unicode emoji via `src/data/icons.ts`. This document catalogs every icon slot, describes what each should depict, and defines a DSL for future custom icon assets.

---

## Style Guide

### Visual Direction

SeaBound is a tropical island survival game with a dark, atmospheric UI. Icons must feel:

- **Hand-drawn / organic** — not pixel-art, not flat corporate. Think ink-on-parchment or woodcut illustrations.
- **Warm-toned** — sandy tans, sun-bleached whites, ocean teals, fire oranges. Match the phase palette below.
- **Silhouette-readable at 24px** — most icons render at 20–32px in mobile UI. They must be instantly recognizable as small silhouettes.
- **Monochrome with accent** — base icon in cream/white (`--text: #e8e4d8`), with a single accent color pulled from the current phase. This lets icons adapt to phase theming automatically.

### Phase Color Palette

Icons should work against the dark background (`--bg: #0c1a1a`) and pair with these phase accents:

| Phase | Accent | Glow | Feel |
|---|---|---|---|
| `bare_hands` | `#c8b090` sandy tan | `rgba(200,176,144,0.2)` | Raw, desperate, sun-bleached |
| `bamboo` | `#7bc67b` leaf green | `rgba(123,198,123,0.2)` | Growth, first tools, hope |
| `fire` | `#f0a050` flame orange | `rgba(240,160,80,0.3)` | Warmth, mastery, transformation |
| `stone` | `#a0a8b8` slate gray | `rgba(160,168,184,0.2)` | Durability, precision, craft |
| `maritime` | `#50b0d0` ocean blue | `rgba(80,176,208,0.3)` | Freedom, horizon, voyage |

### Format Requirements

- SVG preferred (scalable, theme-able via CSS `currentColor`)
- Fallback: PNG at 64x64 and 128x128, transparent background
- Each icon should have an emoji fallback (already defined in `icons.ts`)
- File naming: `{category}/{id}.svg` (e.g., `resources/coconut.svg`)

### Chapter Banners

The phase chapter cards (`ChapterCard.tsx`) are full-screen overlays. Each phase could have:
- A **banner illustration** (wide, ~300x120) showing the phase's thematic scene
- These are atmospheric, not icon-sized — think vignette illustrations

---

## Icon DSL

The DSL describes every icon slot in the game. Format:

```
@category <name>
  <id> : "<visual description>" [<size>] {<tags>}
```

**Fields:**
- `id` — matches the TypeScript enum/type value exactly
- `"visual description"` — what the icon should depict
- `[size]` — rendering context: `[sm]` = 20-24px inline, `[md]` = 32-48px card, `[lg]` = 64px+ feature, `[banner]` = wide illustration
- `{tags}` — metadata: `{phase:X}` = which phase introduces it, `{animated}` = should have idle animation, `{pair:X}` = visually related to another icon

---

## Complete Icon Registry

### Resources (44 icons)

```
@category resources

  # Phase 0 — Bare Hands
  coconut             : "whole brown coconut with husk fibers visible"          [sm] {phase:bare_hands}
  coconut_husk        : "torn coconut husk, fibrous and rough"                 [sm] {phase:bare_hands, pair:coconut}
  driftwood_branch    : "sun-bleached driftwood branch, smooth and curved"     [sm] {phase:bare_hands}
  flat_stone          : "flat gray beach stone, oval, water-worn"              [sm] {phase:bare_hands}
  palm_frond          : "single green palm leaf, long and feathered"           [sm] {phase:bare_hands}
  small_fish          : "small silver tropical fish, side view"                [sm] {phase:bare_hands}
  crab                : "red-orange shore crab, claws raised"                  [sm] {phase:bare_hands}
  shell               : "spiral seashell, cream and pink"                      [sm] {phase:bare_hands}

  # Phase 1 — Bamboo
  bamboo_cane         : "straight green bamboo cane segment"                   [sm] {phase:bamboo}
  bamboo_splinter     : "thin bamboo splinter, sharp edge"                     [sm] {phase:bamboo, pair:bamboo_cane}
  rough_fiber         : "loose bundle of unprocessed plant fiber"              [sm] {phase:bamboo}
  dried_fiber         : "neat coil of pale dried fiber"                        [sm] {phase:bamboo, pair:rough_fiber}
  cordage             : "twisted rope/cordage, coiled"                         [sm] {phase:bamboo}
  large_shell         : "large conch-style shell"                              [sm] {phase:bamboo}
  dry_grass           : "bundle of golden dry grass"                           [sm] {phase:bamboo}

  # Food
  large_fish          : "large tropical fish on a line"                        [sm] {phase:bamboo}
  cooked_fish         : "small fish browned over fire, on a stick"             [sm] {phase:fire, pair:small_fish}
  cooked_crab         : "red cooked crab, shell cracked"                       [sm] {phase:fire, pair:crab}
  cooked_large_fish   : "large fish fillet, fire-seared"                       [sm] {phase:fire, pair:large_fish}

  # Seeds & Farming
  wild_seed           : "small handful of assorted wild seeds"                 [sm] {phase:stone}
  root_vegetable      : "dirty root vegetable, freshly dug"                    [sm] {phase:stone}
  cooked_root_vegetable : "roasted root vegetable, split open"                 [sm] {phase:stone, pair:root_vegetable}
  taro_corm           : "purple-brown taro corm with roots"                    [sm] {phase:stone}
  taro_root           : "harvested taro root, cleaned"                         [sm] {phase:stone, pair:taro_corm}
  cooked_taro         : "steamed taro, purple interior visible"                [sm] {phase:stone, pair:taro_root}
  banana_shoot        : "small banana plant shoot, unfurling leaf"             [sm] {phase:stone}
  banana              : "ripe yellow banana"                                   [sm] {phase:stone, pair:banana_shoot}
  breadfruit_cutting  : "breadfruit branch cutting with leaves"                [sm] {phase:stone}
  breadfruit          : "round green breadfruit, bumpy skin"                   [sm] {phase:stone, pair:breadfruit_cutting}
  roasted_breadfruit  : "charred breadfruit split open, golden inside"         [sm] {phase:stone, pair:breadfruit}
  voyage_provisions   : "sealed clay jar packed with dried food"               [sm] {phase:maritime}

  # Obsidian & Stone
  obsidian            : "chunk of black volcanic obsidian, glossy"             [sm] {phase:stone}
  chert               : "rough reddish-brown chert nodule"                     [sm] {phase:stone}
  stone_flake         : "thin sharp stone flake, knapped edge"                 [sm] {phase:stone, pair:chert}
  stone_blade         : "long narrow stone blade, pressure-flaked"             [sm] {phase:stone, pair:stone_flake}

  # Timber & Water
  large_log           : "thick fallen log, bark intact"                        [sm] {phase:stone}
  charred_log         : "hollowed log, interior blackened by fire"             [sm] {phase:maritime, pair:large_log}
  shaped_hull         : "canoe hull shape, carved from log"                    [sm] {phase:maritime, pair:charred_log}
  fresh_water         : "clear water droplet / water in half-coconut"          [sm] {phase:stone}

  # Clay & Pottery
  clay                : "lump of wet reddish clay"                             [sm] {phase:stone}
  shaped_clay_pot     : "unfired clay pot, rough surface"                      [sm] {phase:stone, pair:clay}
  fired_clay_pot      : "fired terracotta pot, warm orange"                    [sm] {phase:stone, pair:shaped_clay_pot}
  sealed_clay_jar     : "sealed clay storage jar with wax stopper"             [sm] {phase:stone, pair:fired_clay_pot}
```

### Tools (11 icons)

```
@category tools

  bamboo_knife        : "bamboo knife, split-edge blade"                       [sm] {phase:bamboo}
  bow_drill_kit       : "bow drill fire-starting kit, spindle and board"       [sm] {phase:bamboo}
  bamboo_spear        : "long bamboo spear, fire-hardened tip"                 [sm] {phase:bamboo}
  hammerstone         : "round hammerstone, grip-worn"                         [sm] {phase:stone}
  shell_adze          : "adze with large shell blade lashed to handle"         [sm] {phase:bamboo}
  stone_axe           : "stone axe head lashed to wooden handle"              [sm] {phase:stone}
  obsidian_blade      : "obsidian blade, razor-sharp black glass edge"         [sm] {phase:stone}
  gorge_hook          : "bone/wood gorge hook for fishing"                     [sm] {phase:bamboo}
  basket_trap         : "woven basket fish trap, cone-shaped"                  [sm] {phase:bamboo}
  crucible            : "clay crucible, glowing with heat"                     [sm] {phase:stone}
  digging_stick       : "pointed hardwood digging stick"                       [sm] {phase:stone}
```

### Skills (9 icons)

```
@category skills

  foraging            : "open hand reaching for leaves/berries"                [md] {animated}
  fishing             : "fishing line with hook descending into water"         [md] {animated}
  woodworking         : "hands whittling wood with a blade"                    [md]
  crafting            : "stone hammer striking, sparks flying"                 [md]
  cooking             : "flame with pot/food above"                            [md] {animated}
  weaving             : "interlocked woven fibers, basket pattern"             [md]
  construction        : "simple shelter frame / crossed beams"                 [md]
  farming             : "seedling sprouting from tilled earth"                 [md] {animated}
  navigation          : "compass rose / star above waves"                      [md]
```

### Buildings (15 icons)

```
@category buildings

  camp_fire           : "small campfire with three stones, flames"             [md] {phase:fire, animated}
  stone_hearth        : "stone-walled hearth with steady fire"                 [md] {phase:stone, pair:camp_fire}
  palm_leaf_pile      : "mound of layered palm leaves, bed-shaped"             [md] {phase:bare_hands}
  drying_rack         : "wooden frame rack with items hanging to dry"          [md] {phase:bamboo}
  fenced_perimeter    : "bamboo fence section, lashed uprights"                [md] {phase:bamboo}
  firing_pit          : "clay-lined pit with coals glowing"                    [md] {phase:stone}
  kiln                : "domed clay kiln with chimney, smoke rising"           [md] {phase:stone, animated}
  fiber_loom          : "simple frame loom with fiber stretched"               [md] {phase:bamboo}
  raft                : "log raft with bamboo mast and leaf sail"              [md] {phase:maritime}
  dugout              : "dugout canoe with outrigger"                          [md] {phase:maritime}
  woven_basket        : "woven storage basket, lid ajar"                       [md] {phase:bamboo}
  cleared_plot        : "patch of cleared earth with stakes"                   [md] {phase:stone}
  tended_garden       : "garden rows with small green shoots"                  [md] {phase:stone, pair:cleared_plot}
  farm_plot           : "lush farm plot with mature plants"                    [md] {phase:stone, pair:tended_garden}
  well                : "stone-lined well with rope and bucket"                [md] {phase:stone}
```

### Biomes (6 icons)

```
@category biomes

  beach               : "sandy beach with gentle wave and palm shadow"         [lg] {phase:bare_hands}
  coconut_grove       : "cluster of coconut palms, dappled light"              [lg] {phase:bare_hands}
  rocky_shore         : "jagged dark rocks with tide pools"                    [lg] {phase:bare_hands}
  bamboo_grove        : "dense bamboo stalks, green and vertical"              [lg] {phase:bamboo}
  jungle_interior     : "dark jungle canopy, vines and ferns"                  [lg] {phase:stone}
  nearby_island       : "distant island silhouette across water"               [lg] {phase:maritime}
```

### Navigation Tabs (6 icons)

```
@category tabs

  gather              : "open hand grasping / reaching down"                   [md]
  craft               : "hammer striking on anvil-stone"                       [md]
  build               : "tent/shelter frame silhouette"                        [md]
  explore             : "compass with north needle"                            [md]
  inventory           : "woven sack/backpack"                                  [md]
  skills              : "star / level-up star burst"                           [md]
```

### Expeditions (4 icons)

```
@category expeditions

  explore_beach       : "footprints in sand leading along shore"               [md] {phase:bare_hands}
  explore_interior    : "machete-cut path into jungle"                         [md] {phase:bamboo}
  sail_nearby_island  : "raft on open water, island in distance"               [md] {phase:maritime}
  dugout_voyage       : "dugout canoe on open ocean, sunrise horizon"          [md] {phase:maritime}
```

### Phases / Chapter Banners (5 banners + 5 icons)

```
@category phases

  # Small phase indicator icons (shown in header)
  bare_hands_icon     : "two empty open hands"                                 [sm]
  bamboo_icon         : "bamboo shoot, bright green"                           [sm]
  fire_icon           : "single flame"                                         [sm]
  stone_icon          : "stone and clay pot together"                          [sm]
  maritime_icon       : "simple sail on waves"                                 [sm]

  # Full chapter banner illustrations (ChapterCard.tsx overlay)
  bare_hands_banner   : "castaway washed ashore, empty beach at dawn"          [banner]
  bamboo_banner       : "bamboo grove with first tools leaning against stalks" [banner]
  fire_banner         : "campfire at night, sparks rising, dark jungle behind" [banner]
  stone_banner        : "stone workshop scene, clay pots drying, axes on rack" [banner]
  maritime_banner     : "dugout canoe at shore, open ocean horizon at sunset"  [banner]
```

### Notification & Discovery Types (6 icons)

```
@category notifications

  discovery_biome     : "footprint in new terrain"                             [sm] {color:#4ade80}
  discovery_level     : "upward arrow with star"                               [sm] {color:#fbbf24}
  discovery_craft     : "new scroll/blueprint unrolling"                       [sm] {color:#c084fc}
  discovery_building  : "building with sparkle/new badge"                      [sm] {color:#f0a050}
  discovery_resource  : "glowing new item with question-mark reveal"           [sm] {color:#38bdf8}
  discovery_tool      : "new tool silhouette with shine"                       [sm] {color:#a0a8b8}
```

### UI Chrome (8 icons)

```
@category ui

  journal_button      : "open book / scroll"                                   [sm]
  settings_button     : "gear / cog"                                           [sm]
  save_file           : "floppy disk / down-arrow to box"                      [sm]
  load_file           : "folder open / up-arrow from box"                      [sm]
  reset_danger        : "circular arrow with warning triangle"                 [sm] {color:#f87171}
  close_button        : "X mark"                                               [sm]
  collapse_open       : "chevron down"                                         [sm]
  collapse_closed     : "chevron right"                                        [sm]
```

### Stations (5 icons)

```
@category stations

  deploy_basket_trap  : "basket trap submerged in water, fish approaching"     [md] {phase:bamboo}
  plant_wild_seeds    : "hand scattering seeds into soil"                      [md] {phase:stone}
  cultivate_taro      : "taro plant in muddy plot with water"                  [md] {phase:stone}
  grow_bananas        : "banana plant with hanging bunch"                      [md] {phase:stone}
  grow_breadfruit     : "breadfruit tree with round fruits"                    [md] {phase:stone}
```

---

## Summary

| Category | Count |
|---|---|
| Resources | 44 |
| Tools | 11 |
| Skills | 9 |
| Buildings | 15 |
| Biomes | 6 |
| Tabs | 6 |
| Expeditions | 4 |
| Phases (icons) | 5 |
| Phases (banners) | 5 |
| Notifications | 6 |
| UI Chrome | 8 |
| Stations | 5 |
| **Total** | **124** |

---

## DSL Reference

### Grammar

```
specification   = (category | comment | blank)*
category        = "@category" IDENTIFIER NEWLINE entry*
entry           = IDENTIFIER ":" STRING size? tag_list?
size            = "[" ("sm" | "md" | "lg" | "banner") "]"
tag_list        = "{" tag ("," tag)* "}"
tag             = IDENTIFIER (":" VALUE)?
comment         = "#" TEXT
```

### Standard Tags

| Tag | Meaning |
|---|---|
| `phase:<id>` | Game phase that introduces this item |
| `pair:<id>` | Visually related icon (e.g., raw → cooked) |
| `animated` | Should have subtle idle animation (flame flicker, water shimmer) |
| `color:<hex>` | Specific accent color override |

### Size Classes

| Size | Pixels | Use |
|---|---|---|
| `sm` | 20–24px | Inline resource counts, inventory rows, toast icons |
| `md` | 32–48px | Card headers, tab bar, skill panels, building cards |
| `lg` | 64px+ | Biome feature art, expedition cards |
| `banner` | 300x120+ | Chapter card full-width illustration |

### Integration with `icons.ts`

When custom icons are ready, `icons.ts` maps can be extended to reference SVG paths or sprite sheet coordinates instead of emoji strings. The emoji values remain as fallbacks.
