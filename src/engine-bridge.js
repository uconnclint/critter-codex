// ============================================================
// engine-bridge.js — ES module bridge between the classic-script
// game (window.CritterCodex / CC) and clint-engine.
//
// Loaded via ONE <script type="module"> tag, AFTER every classic
// script in index.html. Module scripts run after the document has
// finished parsing (like `defer`) and strictly after every classic
// script that precedes them in source order, so by the time this
// file executes, BootScene..CodexScene and window.__ccStart already
// exist as globals — this module just has to build window.CE /
// window.CEP and then kick the game off.
//
// Nothing here changes MasteryEngine's rules or constants.js's
// tuning — this only wires storage + settings + shared UI plumbing.
// ============================================================

// NOTE the "../" — this file lives in src/, and engine/ is a sibling
// of src/ (repo root), not nested under it.
import { createGameContext } from '../engine/core/context.js';
import {
    button, ghostButton, iconButton, panel, header, pill, toast,
    confettiBurst, enableKeyboardNav
} from '../engine/phaser/ui.js';
import { fitConfig, installResizeGuards, rotateNotice, pageToLogical, logicalToPage } from '../engine/phaser/scale.js';

// ── Save: adopt the game's current default shape ──────────────
// MasteryEngine.save() always writes the full shape below (see
// src/systems/MasteryEngine.js `save()`). NOTE: an empty `ops` here is
// NOT equivalent to the old load()-returns-null fresh-profile signal —
// MasteryEngine.init() only builds its blank per-family records when
// given null, so SaveManager.load() (the shim) maps "ops has no keys"
// back to null. These defaults exist for the engine-side merge/adoption
// machinery, not as a bootable mastery state.
const SAVE_DEFAULTS = {
    ops: {},                                   // per-op per-family mastery state
    session: { op: 'mul', difficulty: 'easy' }, // last-picked operation/difficulty
    missed: {}                                  // per-op recently-missed-fact queues
};

// cc.save.v1 stores `{ version: N, data: {...} }` (see the old
// src/systems/SaveManager.js). Only version 3 has ever shipped to
// real players, but we deliberately do NOT gate on that number here:
// createSave()'s own outer merge (`{...defaults, ...migrated}`)
// already backfills any top-level field an odd/older shape is
// missing, so being lenient about the envelope can only recover more
// of a kid's progress, never less — and "kids' existing data MUST
// survive" beats a version-number technicality the old strict check
// would have wiped on.
function migrateLegacySave(raw) {
    var data = raw && typeof raw === 'object' ? raw.data : null;
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : null;
}

// cc.muted was written ONLY as the string '1' (muted) or '0' (not
// muted) by the old AudioManager.setMuted() — never 'true'/'false'.
// Matches AudioManager's own historical read exactly: `=== '1'`.
// Returning null (key never set) is deliberate, not an oversight: a
// player who has progress but never touched the mute button has no
// EXPLICIT saved preference to honor, so they correctly fall through
// to the engine's new muted-by-default standard (Clint's Q11) rather
// than silently keeping the old implicit default of "audible".
function readLegacyMuted(storage) {
    var raw;
    try { raw = storage.getItem('cc.muted'); } catch (e) { return null; }
    if (raw === null) return null;
    return { muted: raw === '1' };
}

window.CE = createGameContext({
    gameId: 'critter-codex',
    saveVersion: 1,
    saveDefaults: SAVE_DEFAULTS,
    legacySaveKeys: ['cc.save.v1'],
    saveMigrate: migrateLegacySave,
    legacySettingsReaders: [readLegacyMuted]
});

// Shared Phaser UI kit, exposed as a global so the (still-classic)
// scene scripts can call CEP.button(...) etc. without becoming
// modules themselves. Must be set before __ccStart() runs.
window.CEP = {
    button: button, ghostButton: ghostButton, iconButton: iconButton,
    panel: panel, header: header, pill: pill, toast: toast,
    confettiBurst: confettiBurst, enableKeyboardNav: enableKeyboardNav,
    fitConfig: fitConfig, installResizeGuards: installResizeGuards,
    rotateNotice: rotateNotice, pageToLogical: pageToLogical, logicalToPage: logicalToPage
};

// Everything the classic scripts need (CC.*, window.CE, window.CEP)
// exists now — boot the actual Phaser.Game (defined in src/main.js).
window.__ccStart();
