// ============================================================
// Critter Codex — Global Namespace + Constants
// All magic numbers, game config, species data, and shared
// utilities live here. (Loaded first; no dependencies.)
// ============================================================

window.CritterCodex = window.CritterCodex || {};

const CC = window.CritterCodex;

// ── Canvas Dimensions ─────────────────────────────────────────
CC.WIDTH  = 1024;
CC.HEIGHT = 768;

// ── Palette (Phaser hex 0x...) ────────────────────────────────
CC.COLORS = {
    BG:        0x1b2233,   // deep slate (page/canvas backdrop)
    PANEL:     0x273349,   // card / panel fill
    PANEL_HI:  0x33415c,   // lighter panel / hover
    INK:       0x0f1420,   // near-black outlines
    CREAM:     0xf6efe2,   // primary light text
    MUTED:     0x9fb0c8,   // secondary text
    GOLD:      0xf4b41a,   // accent / XP
    SUCCESS:   0x5cc98a,   // correct
    GENTLE:    0x6fb3e8,   // gentle "here's the answer" blue
    SLEEPY:    0x7c83e8,   // sleepy indicator
    WHITE:     0xffffff,
    BLACK:     0x000000
};

// ── CSS hex strings (for Phaser text color / DOM) ─────────────
CC.HEX = {
    BG:       '#1b2233',
    PANEL:    '#273349',
    PANEL_HI: '#33415c',
    INK:      '#0f1420',
    CREAM:    '#f6efe2',
    MUTED:    '#9fb0c8',
    GOLD:     '#f4b41a',
    SUCCESS:  '#5cc98a',
    GENTLE:   '#6fb3e8',
    SLEEPY:   '#7c83e8',
    WHITE:    '#ffffff'
};

// ── Tunable config (GDD §5 / §8) ──────────────────────────────
CC.CFG = {
    XP_CORRECT:    10,      // XP for a correct answer
    XP_FAST_BONUS:  5,      // extra XP when answered quickly
    FAST_MS:     3500,      // "fast" threshold — under this earns the speed bonus
    XP_WRONG:       0,      // never punish — wrong costs nothing

    HATCHLING_XP:  50,      // Egg → Hatchling threshold
    ADULT_XP:     150,      // Hatchling → Adult threshold

    // How long a family can go un-practiced before its critter gets "sleepy".
    // PRODUCTION value (~2 days). For a quick demo of the spaced-repetition
    // mechanic, temporarily swap to the 25s value below (or use the teacher
    // tool "Simulate a day", which works regardless of this setting).
    DECAY_MS:    1.7e8,
    // DECAY_MS: 25000,     // ← demo: critters get sleepy in 25s

    // Fact-selection weighting (MasteryEngine.pickFact)
    WEIGHT_BASE:        1.0,   // every family is always eligible
    WEIGHT_SLEEPY:      4.0,   // big nudge toward families that have gone sleepy
    WEIGHT_LOW_MASTERY: 3.0,   // nudge toward families far from Adult (× shortfall)

    FACT_MIN: 1,    // family "known facts" list runs ×1 ..
    FACT_MAX: 10    //                                  .. ×10
};

// ── Operations (GDD §7: the engine is operation-agnostic) ─────
// Each operation drills the SAME 8 critters (families 2–9) but
// tracks its own progress. The family number is the fixed operand
// you're practising; difficulty scales the OTHER number.
CC.OPERATIONS = [
    { key: 'add', label: 'Addition',       symbol: '+', color: 0x5CC98A, colorHex: '#5CC98A' },
    { key: 'sub', label: 'Subtraction',    symbol: '−', color: 0x3E8EDE, colorHex: '#3E8EDE' },
    { key: 'mul', label: 'Multiplication', symbol: '×', color: 0xF4B41A, colorHex: '#F4B41A' },
    { key: 'div', label: 'Division',       symbol: '÷', color: 0x9B5DE5, colorHex: '#9B5DE5' }
];
CC.OP_KEYS = CC.OPERATIONS.map(function(o) { return o.key; });
CC.opByKey = function(key) {
    for (var i = 0; i < CC.OPERATIONS.length; i++) {
        if (CC.OPERATIONS[i].key === key) return CC.OPERATIONS[i];
    }
    return CC.OPERATIONS[0];
};

// ── Difficulty (magnitude of the varying number) ──────────────
//   easy   single digits      (1–9)
//   medium low double digits  (10–29)
//   hard   high double digits (30–99)
// Higher difficulty grants a small XP bonus so it's worth doing.
// 'adaptive' has no fixed band — the engine resolves it per critter
// (Egg → easy, Hatchling → medium, Adult → hard) so questions grow with
// each critter's mastery.
CC.DIFFICULTIES = [
    { key: 'easy',     label: 'Easy',     blurb: 'Single digits',         band: [2, 9],   xpBonus: 0 },
    { key: 'medium',   label: 'Medium',   blurb: 'Low double digits',     band: [10, 29], xpBonus: 3 },
    { key: 'hard',     label: 'Hard',     blurb: 'High double digits',    band: [30, 99], xpBonus: 6 },
    { key: 'adaptive', label: 'Adaptive', blurb: 'Auto-adjusts',           band: null,   xpBonus: 3 }
];
CC.diffByKey = function(key) {
    for (var i = 0; i < CC.DIFFICULTIES.length; i++) {
        if (CC.DIFFICULTIES[i].key === key) return CC.DIFFICULTIES[i];
    }
    return CC.DIFFICULTIES[0];
};

// Current practice session selection (restored from save on boot).
CC.session = { op: 'mul', difficulty: 'easy' };

// ── Fact construction ─────────────────────────────────────────
// Given an operation, a family (the fixed operand, 2–9), and a
// varying value v, return everything a screen needs to render and
// grade the fact. The family is always the "skill" being drilled.
//   add:  family + v
//   sub:  (family + v) − family      → answer v (subtract the family)
//   mul:  family × v
//   div:  (family × v) ÷ family      → answer v (divide by the family)
CC.buildFact = function(opKey, family, v) {
    var op = CC.opByKey(opKey);
    var n1, n2, answer;
    switch (opKey) {
        case 'add': n1 = family;         n2 = v;      answer = family + v; break;
        case 'sub': n1 = family + v;     n2 = family; answer = v;          break;
        case 'mul': n1 = family;         n2 = v;      answer = family * v; break;
        case 'div': n1 = family * v;     n2 = family; answer = v;          break;
    }
    return {
        op: opKey, family: family, v: v,
        n1: n1, n2: n2, answer: answer,
        prompt: n1 + ' ' + op.symbol + ' ' + n2
    };
};

// ── Evolution reward (PLACEHOLDER) ────────────────────────────
// Returns the reward content shown in the evolution celebration.
// TODO: replace this placeholder with real rewards (stickers, fun
// facts, unlockables, etc.) — to be designed.
CC.getEvolutionReward = function(op, family, newStage) {
    return {
        title: '🎁 Reward (placeholder)',
        body: 'A reward will appear here — to be designed.'
    };
};

// The 10 representative "known facts" for a family in an operation
// (varying value 1..10), for the Codex detail list.
CC.factsForFamily = function(opKey, family) {
    var out = [];
    for (var v = 1; v <= 10; v++) {
        var f = CC.buildFact(opKey, family, v);
        out.push(f.prompt + ' = ' + f.answer);
    }
    return out;
};

// ── Evolution stages ──────────────────────────────────────────
CC.STAGES = ['egg', 'hatchling', 'adult'];
CC.STAGE_LABEL = { egg: 'Egg', hatchling: 'Hatchling', adult: 'Adult' };

// ── Families → species, PER OPERATION ─────────────────────────
// Each operation has its OWN themed set of 8 critters (one per
// family 2–9), so collecting all four worlds means 32 distinct
// critters × 3 stages = 96 creature forms.
//   family : the anchor number being drilled (2–9)
//   biome  : home region label
//   names  : [ Egg, Hatchling, Adult ]
//   colorHex / color : primary species color (CSS + Phaser hex)
//   desc   : short description (drives placeholder art + flavor)
CC.FAMILIES = [2, 3, 4, 5, 6, 7, 8, 9];

CC.SPECIES_BY_OP = {
    // ×  Multiplication — "Cosmic & Elemental" (existing art set)
    mul: [
        { family: 2, biome: 'Star Meadow',   names: ['Twinkit', 'Twinkle', 'Twinstar'],   colorHex: '#F4B41A', color: 0xF4B41A, desc: 'a round fuzzy star-cub speckled with tiny stars, single star-tipped tail' },
        { family: 3, biome: 'Triplet Grove',  names: ['Treeple', 'Trifern', 'Triphant'],   colorHex: '#4CAF6E', color: 0x4CAF6E, desc: 'a leafy sprout-creature with fern fronds and small bark legs' },
        { family: 4, biome: 'Pebble Quarry',  names: ['Pebblo', 'Cobbla', 'Quartzilla'],   colorHex: '#C97B4A', color: 0xC97B4A, desc: 'a stocky friendly rock-golem cub with crystal shards on its back' },
        { family: 5, biome: 'Tidepool Cove',  names: ['Fivvle', 'Splashen', 'Tidalord'],   colorHex: '#3E8EDE', color: 0x3E8EDE, desc: 'a cheerful water-droplet otter with fin ears and a wavy tail' },
        { family: 6, biome: 'Ember Hollow',   names: ['Embder', 'Flammo', 'Blazex'],       colorHex: '#EF6C3D', color: 0xEF6C3D, desc: 'a fluffy ember-fox with a soft flame-tipped tail and warm glow' },
        { family: 7, biome: 'Cloud Reach',    names: ['Wispine', 'Nimbo', 'Stratos'],      colorHex: '#7C83E8', color: 0x7C83E8, desc: 'a puffy cloud-lamb with little curled lightning horns' },
        { family: 8, biome: 'Hive Thicket',   names: ['Octling', 'Buzzle', 'Hivemind'],    colorHex: '#9B5DE5', color: 0x9B5DE5, desc: 'a round fuzzy beetle-bee with patterned translucent wings' },
        { family: 9, biome: 'Frost Hollow',   names: ['Frostle', 'Glimmra', 'Glacius'],    colorHex: '#2BC5C0', color: 0x2BC5C0, desc: 'a crystalline snow-fox with icicle whiskers and a frosty mane' }
    ],
    // +  Addition — "Sugarwood Vale" (sweet candy & fruit critters)
    add: [
        { family: 2, biome: 'Berry Bramble',  names: ['Berrykit', 'Berribun', 'Berrybloom'],     colorHex: '#FF6F91', color: 0xFF6F91, desc: 'a round candy-pink berry-bunny with leafy ears and a glossy berry on its tail' },
        { family: 3, biome: 'Honey Hollow',   names: ['Honeypip', 'Honeycub', 'Honeymont'],      colorHex: '#F2A93B', color: 0xF2A93B, desc: 'a chubby golden honey-bear cub with sticky honey-drip markings' },
        { family: 4, biome: 'Mint Glade',     names: ['Mintle', 'Minthop', 'Mintguard'],         colorHex: '#5FD3A0', color: 0x5FD3A0, desc: 'a smooth mint-green candy-frog with a swirl-mint belly' },
        { family: 5, biome: 'Cotton Cove',    names: ['Floofkin', 'Cottlamb', 'Cottomonarch'],   colorHex: '#E58BD0', color: 0xE58BD0, desc: 'a fluffy cotton-candy lamb in pink-and-purple swirls' },
        { family: 6, biome: 'Caramel Dunes',  names: ['Carapup', 'Caramutt', 'Caramajor'],       colorHex: '#D69A5C', color: 0xD69A5C, desc: 'a glossy caramel-pup with a drizzle pattern and soft floppy ears' },
        { family: 7, biome: 'Plum Thicket',   names: ['Plumlet', 'Plumow', 'Plumlord'],          colorHex: '#6C7CE0', color: 0x6C7CE0, desc: 'a round plum-purple owl with big sweet eyes' },
        { family: 8, biome: 'Peach Orchard',  names: ['Peachlet', 'Peachpaw', 'Peachprince'],    colorHex: '#FFB07C', color: 0xFFB07C, desc: 'a soft peach-orange kitten with a leafy peach-stem tuft' },
        { family: 9, biome: 'Lemon Lift',     names: ['Lemmie', 'Lemwing', 'Lemontide'],         colorHex: '#F2D24B', color: 0xF2D24B, desc: 'a bright lemon-yellow finch with zesty rind-textured wings' }
    ],
    // −  Subtraction — "Mistveil Reach" (cool twilight, ghostly-cute)
    sub: [
        { family: 2, biome: 'Dusk Hollow',    names: ['Wispit', 'Wispen', 'Wispwarden'],         colorHex: '#8C9BD6', color: 0x8C9BD6, desc: 'a shy translucent ghost-kit with a soft glowing wispy tail' },
        { family: 3, biome: 'Foggy Fen',      names: ['Foggle', 'Misthop', 'Mistmonarch'],       colorHex: '#7FB7C4', color: 0x7FB7C4, desc: 'a misty pale-teal frog with cloudy vapor trailing off its back' },
        { family: 4, biome: 'Shadow Glade',   names: ['Shadlet', 'Shadepaw', 'Shadeprince'],     colorHex: '#6E5EA8', color: 0x6E5EA8, desc: 'a sleek dusky-violet shadow-fox with soft glowing eyes' },
        { family: 5, biome: 'Moon Mire',      names: ['Lunet', 'Lunamoth', 'Lunarch'],           colorHex: '#B0A0E6', color: 0xB0A0E6, desc: 'a gentle lavender moon-moth with crescent-patterned wings' },
        { family: 6, biome: 'Whisper Woods',  names: ['Echlet', 'Echowl', 'Echoseer'],           colorHex: '#5FA3A0', color: 0x5FA3A0, desc: 'a quiet teal echo-owl with ripple-ring markings' },
        { family: 7, biome: 'Glimmer Tarn',   names: ['Glimlet', 'Glimmew', 'Glimwarden'],       colorHex: '#9C84C7', color: 0x9C84C7, desc: 'a glowing soft-purple newt dotted with tiny starlight specks' },
        { family: 8, biome: 'Veil Vale',      names: ['Veilfawn', 'Veildoe', 'Veilmonarch'],     colorHex: '#A6C2DA', color: 0xA6C2DA, desc: 'a delicate misty-blue deer draped in a translucent veil' },
        { family: 9, biome: 'Hush Hollow',    names: ['Nivlet', 'Nivmew', 'Nivenlord'],          colorHex: '#86C9DA', color: 0x86C9DA, desc: 'a frosty pale-cyan snow-sprite with a soft flurry aura' }
    ],
    // ÷  Division — "Gemspire Depths" (faceted crystal & gem critters)
    div: [
        { family: 2, biome: 'Quartz Cavern',  names: ['Quartzle', 'Quartzo', 'Quartzlord'],      colorHex: '#B07DFF', color: 0xB07DFF, desc: 'a faceted amethyst-quartz cub with crystal-cluster fur' },
        { family: 3, biome: 'Emerald Vault',  names: ['Emralet', 'Emralo', 'Emraldking'],        colorHex: '#2ECC8F', color: 0x2ECC8F, desc: 'a shiny emerald-green gem-beetle with a faceted shell' },
        { family: 4, biome: 'Ruby Rift',      names: ['Rublet', 'Rubyo', 'Rubymonarch'],         colorHex: '#E8556B', color: 0xE8556B, desc: 'a tiny ruby-red gem-drakeling with glittering scales' },
        { family: 5, biome: 'Sapphire Sink',  names: ['Saphlet', 'Saphoo', 'Saphalord'],         colorHex: '#3E7BE8', color: 0x3E7BE8, desc: 'a smooth sapphire-blue gem-seal with a polished crystal nose' },
        { family: 6, biome: 'Topaz Tunnel',   names: ['Topple', 'Topazo', 'Topazguard'],         colorHex: '#F2B83B', color: 0xF2B83B, desc: 'a sturdy golden-topaz tortoise with a faceted gem shell' },
        { family: 7, biome: 'Amethyst Abyss', names: ['Amethlet', 'Ametho', 'Amethlord'],        colorHex: '#8A4FD6', color: 0x8A4FD6, desc: 'a small deep-violet amethyst bat with crystalline wings' },
        { family: 8, biome: 'Opal Oasis',     names: ['Opalet', 'Opaloo', 'Opalmonarch'],        colorHex: '#4FD8C8', color: 0x4FD8C8, desc: 'a round opal-teal octo-critter shimmering with rainbow flecks' },
        { family: 9, biome: 'Diamond Deep',   names: ['Diamlet', 'Diamo', 'Diamondlord'],        colorHex: '#AFE0F0', color: 0xAFE0F0, desc: 'a sparkling clear-diamond deer with prismatic antlers' }
    ]
};

// The 8 species for an operation, and lookup of one by family.
CC.speciesList = function(op) { return CC.SPECIES_BY_OP[op] || CC.SPECIES_BY_OP.mul; };
CC.species = function(op, family) {
    var list = CC.speciesList(op);
    for (var i = 0; i < list.length; i++) {
        if (list[i].family === family) return list[i];
    }
    return null;
};

// ── Small shared helpers ──────────────────────────────────────
CC.util = {
    // Inclusive integer in [min, max]
    randInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    // Pick a random element
    pick: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Fisher–Yates shuffle (returns the same array, shuffled)
    shuffle: function(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    },
    clamp: function(v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    }
};

// Texture key for an operation/species/stage (matches the real-art
// filename base). Real art (when present) lives at:
//   Multiplication: assets/x{family}_{stage}.png      (e.g. x6_adult)
//   Other ops:      assets/{op}{family}_{stage}.png   (e.g. add6_adult)
// Multiplication keeps the "x" prefix so the original 24 PNGs still load.
CC.texKey = function(op, family, stage) {
    var prefix = (op === 'mul') ? 'x' : op;
    return prefix + family + '_' + stage;
};
