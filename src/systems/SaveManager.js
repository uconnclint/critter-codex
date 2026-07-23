// ============================================================
// SaveManager — thin shim over the shared engine save service.
//
// Storage probing, in-memory fallback, debounced writes, the
// pagehide/visibilitychange auto-flush, and cc.save.v1 legacy
// adoption all now live in window.CE.save (see engine/core/save.js,
// wired up in src/engine-bridge.js) — this file keeps the ORIGINAL
// CC.SaveManager.{save,load,clear} surface so BootScene/MasteryEngine
// don't need to change at all.
// ============================================================

window.CritterCodex.SaveManager = (function() {

    // MasteryEngine.save() always passes the full { ops, session,
    // missed } shape (never a partial update), so patch()'s shallow
    // Object.assign over those three top-level keys is equivalent to
    // a full overwrite — just debounced now instead of synchronous
    // (CE.save's own pagehide/visibilitychange flush still guarantees
    // nothing is lost on tab close).
    function save(data) {
        window.CE.save.patch(data);
    }

    // Always returns the live state object (never null) — CE.save
    // seeds it from saveDefaults ({ ops: {}, session: {...}, missed: {} })
    // when there's nothing saved yet, which MasteryEngine.init() already
    // treats identically to the old load()-returns-null case (every
    // per-family lookup there is a truthiness check, e.g.
    // `saved && saved.ops && saved.ops[op] && saved.ops[op][family]`).
    function load() {
        return window.CE.save.get();
    }

    // Resets to a fresh copy of the defaults and persists immediately
    // (CE.save.reset()) instead of removing the key outright — either
    // way the next load() comes back blank, which is all MasteryEngine
    // relies on (it also resets its own in-memory state first via
    // init(null), independently of this call).
    function clear() {
        window.CE.save.reset();
    }

    return { save: save, load: load, clear: clear };
})();
