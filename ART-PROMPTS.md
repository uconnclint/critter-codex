# Critter Codex — Art Generation Brief (Pixar vibe)

The game now has **four operations, each with its own set of 8 critters** (families 2–9),
every critter in 3 stages (Egg → Hatchling → Adult). That's **96 creature images** total.

- ✅ **Multiplication (24 images) is already done** — your existing `x{family}_{stage}.png` files.
  Leave them as-is.
- 🎨 **You need to generate 72 NEW images** — Addition, Subtraction, and Division (24 each).

The game already renders procedural placeholders for the new sets, so it works right now;
these PNGs just swap in for the polished look.

---

## How to use this (read first)

1. **Work one species at a time, in a single conversation.** Paste that operation's
   **World Style Prompt** once, then ask for that species' **Egg**, then **Hatchling**, then
   **Adult** in the same chat — *"same character, same colors and style, next evolution stage."*
   Keeping a species' three stages in one thread is what keeps the line cohesive.
2. **Re-paste the World Style Prompt** at the start of each new species so the whole set shares a look.
3. **Save each file with the EXACT name** in the tables below (the game loads by filename).
4. **Drop all PNGs into the `assets/` folder** (same level as `index.html`). The loader is already wired.

### Output requirements (state these every time)
- **512 × 512 px**, **transparent background** (alpha — no backdrop, no scenery).
- **One creature, centered, full body, front-facing**, with a little margin.
- **No text, no drop shadow, no ground plane, no border** — the game adds its own background.
- **Readable as a clear silhouette at ~170 px** (Codex card size). Bold, chunky shapes; no thin wispy
  details that vanish when shrunk.
- **Consistent within each operation's set of 8** — same render style, lighting, eye style, proportions.

> Practical note: image models often ignore exact pixel sizes and sometimes add a faint background.
> Ask for "true transparent PNG, no background at all," then crop/remove background and pad to a
> square 512×512 canvas before saving.

### Shared Pixar look (the base for every world)
> A friendly collectible creature for a children's educational game, rendered in a **modern 3D Pixar
> style** — soft global illumination, gentle subsurface scattering, smooth rounded appealing forms,
> slightly glossy plush-like surfaces, big expressive sparkly eyes, warm inviting expression.
> Cinematic soft key light from the upper left, soft fill, subtle rim light. Cute and huggable.
> **Full body, front-facing, centered, fully transparent background — no scenery, text, shadow, or
> border.** Bold, instantly readable silhouette that stays clear at small icon size. Square image.

### Stage rules (apply to every species)
- **Egg** — a smooth glossy egg/pod in the species' colors and surface motif, hinting at the creature
  inside. No face (or the faintest hint). A tiny signature accent on top.
- **Hatchling** — a tiny chubby **baby**: oversized head, huge sparkly eyes, stubby limbs, one small
  signature feature. Maximum cuteness.
- **Adult** — the grown form of the same character: larger, more defined, fuller signature features,
  confident friendly smile. Still rounded and appealing.

---

# ➕ ADDITION — "Sugarwood Vale"

**World Style Prompt** (paste once per species, after/with the shared Pixar look):
> Sweet candy-and-fruit creature world: bright, glossy, sugary pastel colors, soft confectionery
> textures, cheerful and appetizing. Each critter is a cute candy/fruit animal hybrid.

| File base | Color | Creature |
|---|---|---|
| `add2` | `#FF6F91` candy pink | a round candy-pink **berry-bunny** with leafy ears and a glossy berry on its tail |
| `add3` | `#F2A93B` honey gold | a chubby golden **honey-bear cub** with sticky honey-drip markings |
| `add4` | `#5FD3A0` mint green | a smooth mint-green **candy-frog** with a swirl-mint belly |
| `add5` | `#E58BD0` bubblegum | a fluffy **cotton-candy lamb** in pink-and-purple swirls |
| `add6` | `#D69A5C` caramel | a glossy **caramel-pup** with a drizzle pattern and soft floppy ears |
| `add7` | `#6C7CE0` plum blue | a round plum-purple **owl** with big sweet eyes |
| `add8` | `#FFB07C` peach | a soft peach-orange **kitten** with a leafy peach-stem tuft |
| `add9` | `#F2D24B` lemon | a bright lemon-yellow **finch** with zesty rind-textured wings |

Files: `add2_egg.png` `add2_hatchling.png` `add2_adult.png` … through `add9_*` (24 files).

---

# ➖ SUBTRACTION — "Mistveil Reach"

**World Style Prompt:**
> Cool twilight creature world: soft glowing pastels against a calm dusk palette, gentle mist and
> faint inner glow, dreamy and a little mysterious but still cute and friendly (never scary). Each
> critter is slightly translucent or wispy.

| File base | Color | Creature |
|---|---|---|
| `sub2` | `#8C9BD6` periwinkle | a shy translucent **ghost-kit** with a soft glowing wispy tail |
| `sub3` | `#7FB7C4` misty teal | a misty pale-teal **frog** with cloudy vapor trailing off its back |
| `sub4` | `#6E5EA8` dusk violet | a sleek dusky-violet **shadow-fox** with soft glowing eyes |
| `sub5` | `#B0A0E6` lavender | a gentle lavender **moon-moth** with crescent-patterned wings |
| `sub6` | `#5FA3A0` deep teal | a quiet teal **echo-owl** with ripple-ring markings |
| `sub7` | `#9C84C7` soft purple | a glowing soft-purple **newt** dotted with tiny starlight specks |
| `sub8` | `#A6C2DA` misty blue | a delicate misty-blue **deer** draped in a translucent veil |
| `sub9` | `#86C9DA` pale cyan | a frosty pale-cyan **snow-sprite** with a soft flurry aura |

Files: `sub2_egg.png` … `sub9_adult.png` (24 files).

---

# ➗ DIVISION — "Gemspire Depths"

**World Style Prompt:**
> Crystal-and-gem creature world: faceted jewel surfaces, polished gemstone shine, sparkly highlights,
> rich saturated jewel tones. Each critter is a cute animal made of or studded with gemstones (still
> soft, rounded, and huggable — not sharp).

| File base | Color | Creature |
|---|---|---|
| `div2` | `#B07DFF` amethyst | a faceted amethyst-quartz **cub** with crystal-cluster fur |
| `div3` | `#2ECC8F` emerald | a shiny emerald-green **gem-beetle** with a faceted shell |
| `div4` | `#E8556B` ruby | a tiny ruby-red **gem-drakeling** (baby dragon) with glittering scales |
| `div5` | `#3E7BE8` sapphire | a smooth sapphire-blue **gem-seal** with a polished crystal nose |
| `div6` | `#F2B83B` topaz | a sturdy golden-topaz **tortoise** with a faceted gem shell |
| `div7` | `#8A4FD6` deep violet | a small deep-violet **amethyst bat** with crystalline wings |
| `div8` | `#4FD8C8` opal teal | a round opal-teal **octo-critter** shimmering with rainbow flecks |
| `div9` | `#AFE0F0` diamond | a sparkling clear-diamond **deer** with prismatic antlers |

Files: `div2_egg.png` … `div9_adult.png` (24 files).

---

## 📁 Filename rules (critical)

`assets/{base}_{stage}.png` — three stages each: `_egg`, `_hatchling`, `_adult`.

- Addition  → `add2_egg.png` … `add9_adult.png`
- Subtraction → `sub2_egg.png` … `sub9_adult.png`
- Division  → `div2_egg.png` … `div9_adult.png`
- Multiplication (already done) → `x2_egg.png` … `x9_adult.png`

That's 72 new files (+ your existing 24 = 96).

> Tip: you can add them a set or even a species at a time. Any creature without art keeps its
> placeholder, so the game always works with a partial set. The loader is already turned on — just
> drop files in and reload.
