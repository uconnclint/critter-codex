// ============================================================
// SaveManager — localStorage persistence (per-device)
// Degrades gracefully to in-memory if storage is unavailable
// (e.g. a sandboxed iframe), so the game never crashes.
// ============================================================

window.CritterCodex.SaveManager = (function() {
    const SAVE_KEY = 'cc.save.v1';
    const VERSION  = 3;   // v3: + per-operation critter sets & missed-fact memory

    // In-memory mirror, used as a fallback when localStorage is blocked.
    var memoryBlob = null;
    var storageOk  = (function() {
        try {
            var k = '__cc_probe__';
            localStorage.setItem(k, '1');
            localStorage.removeItem(k);
            return true;
        } catch (e) {
            return false;
        }
    })();

    function save(data) {
        var blob = JSON.stringify({ version: VERSION, data: data });
        memoryBlob = blob;
        if (!storageOk) return;
        try {
            localStorage.setItem(SAVE_KEY, blob);
        } catch (e) {
            console.warn('[SaveManager] Could not save:', e);
        }
    }

    function load() {
        var raw = null;
        if (storageOk) {
            try { raw = localStorage.getItem(SAVE_KEY); }
            catch (e) { console.warn('[SaveManager] Could not load:', e); }
        }
        if (raw === null) raw = memoryBlob;
        if (!raw) return null;
        try {
            var parsed = JSON.parse(raw);
            if (parsed.version !== VERSION) { clear(); return null; }
            return parsed.data || null;
        } catch (e) {
            console.warn('[SaveManager] Corrupt save, clearing:', e);
            clear();
            return null;
        }
    }

    function clear() {
        memoryBlob = null;
        if (!storageOk) return;
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    }

    return { save: save, load: load, clear: clear };
})();
