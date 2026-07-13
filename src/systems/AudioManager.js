// ============================================================
// AudioManager — Web Audio API SFX + gentle ambient music
// (no audio files needed). Friendly, soft chiptune for K–4.
// A mute toggle (persisted) silences everything.
// ============================================================

window.CritterCodex.AudioManager = (function() {

    var ctx       = null;
    var masterVol = null;
    var musicGain = null;
    var musicTimer = null;
    var musicStep = 0;

    var MUTE_KEY = 'cc.muted';
    var muted = (function() {
        try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
    })();

    var BASE_VOL = 0.35;

    // ── Init (must follow a user gesture) ─────────────────────
    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume();
            startMusic();
            return;
        }
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterVol = ctx.createGain();
            masterVol.gain.value = muted ? 0 : BASE_VOL;
            masterVol.connect(ctx.destination);
            if (ctx.state === 'suspended') ctx.resume();
            startMusic();
        } catch (e) {
            ctx = null;
        }
    }

    // ── Mute control (persisted) ──────────────────────────────
    function isMuted() { return muted; }
    function setMuted(m) {
        muted = !!m;
        try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
        if (masterVol) masterVol.gain.value = muted ? 0 : BASE_VOL;
    }
    function toggleMuted() { setMuted(!muted); return muted; }

    // ── Primitive note ────────────────────────────────────────
    function note(freq, type, vol, t0, dur) {
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var g   = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(masterVol);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    function now0() { return ctx ? ctx.currentTime : 0; }

    // ── Ambient background music (soft pentatonic loop) ───────
    var SCALE = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // G A C D E G
    function startMusic() {
        if (!ctx || musicTimer) return;
        musicGain = ctx.createGain();
        musicGain.gain.value = 0.16;
        musicGain.connect(masterVol);
        musicTimer = window.setInterval(function() {
            if (!ctx || muted) return;
            var t = ctx.currentTime;
            var f = SCALE[musicStep % SCALE.length];
            // gentle melody note
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.9, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
            o.connect(g); g.connect(musicGain);
            o.start(t); o.stop(t + 0.95);
            // soft bass root every fourth step
            if (musicStep % 4 === 0) {
                var b = ctx.createOscillator(), bg = ctx.createGain();
                b.type = 'sine'; b.frequency.value = 130.81; // C3
                bg.gain.setValueAtTime(0.0001, t);
                bg.gain.exponentialRampToValueAtTime(0.6, t + 0.1);
                bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
                b.connect(bg); bg.connect(musicGain);
                b.start(t); b.stop(t + 1.55);
            }
            musicStep++;
        }, 720);
    }

    // ── Named cues ────────────────────────────────────────────
    function tap() {
        if (!ctx) return;
        note(440, 'sine', 0.18, now0(), 0.08);
    }
    function correct() {
        if (!ctx) return;
        var t = now0();
        note(659.25, 'triangle', 0.28, t,        0.12); // E5
        note(987.77, 'triangle', 0.26, t + 0.10, 0.16); // B5
    }
    function fast() {
        if (!ctx) return;
        var t = now0();
        note(659.25, 'triangle', 0.26, t,        0.10); // E5
        note(880.00, 'triangle', 0.26, t + 0.08, 0.10); // A5
        note(1318.5, 'triangle', 0.24, t + 0.16, 0.16); // E6
    }
    function gentleWrong() {
        if (!ctx) return;
        var t = now0();
        note(392.00, 'sine', 0.22, t,        0.14); // G4
        note(523.25, 'sine', 0.20, t + 0.12, 0.16); // C5 (resolves upward)
    }
    function evolve() {
        if (!ctx) return;
        var t = now0();
        var seq = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        seq.forEach(function(f, i) { note(f, 'triangle', 0.30, t + i * 0.10, 0.18); });
        note(1318.5, 'triangle', 0.26, t + 0.46, 0.30);    // sparkle top
    }
    function streak() {
        if (!ctx) return;
        var t = now0();
        // Quick upbeat triad for a streak milestone.
        note(523.25, 'square', 0.18, t,        0.09);
        note(659.25, 'square', 0.18, t + 0.07, 0.09);
        note(783.99, 'square', 0.18, t + 0.14, 0.14);
    }

    return {
        init: init,
        isMuted: isMuted, setMuted: setMuted, toggleMuted: toggleMuted,
        tap: tap, correct: correct, fast: fast,
        gentleWrong: gentleWrong, evolve: evolve, streak: streak
    };
})();
