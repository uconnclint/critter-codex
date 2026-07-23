// ============================================================
// main.js — Phaser config + game boot
// ============================================================

// Boot is now a named global (window.__ccStart) called by
// src/engine-bridge.js — a <script type="module"> that runs AFTER
// every classic script here, once window.CE / window.CEP exist. Module
// scripts execute after the document has finished parsing (same timing
// as `defer`), which is already past DOMContentLoaded's own trigger
// point, so no extra readiness wait is needed here.
window.__ccStart = function() {
    const config = {
        type: Phaser.AUTO,
        width:  CC.WIDTH,    // 1024
        height: CC.HEIGHT,   // 768
        parent: 'game-container',
        backgroundColor: CC.HEX.BG,

        scale: {
            mode:       Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },

        render: {
            antialias: true,
            roundPixels: true
        },

        // No physics — tweens only.
        scene: [BootScene, MenuScene, SelectScene, PracticeScene, CodexScene]
    };

    window._phaserGame = new Phaser.Game(config);
};

// ── Touch-device hardening (iPad Safari / Chromebook) ─────────
// Unlock Web Audio on the very first user gesture anywhere (iOS
// requires audio to start from a gesture). AudioManager.init() is
// idempotent, so calling it again from the scenes is harmless.
['pointerdown', 'touchstart', 'keydown'].forEach(function(ev) {
    window.addEventListener(ev, function unlock() {
        if (window.CritterCodex && CC.AudioManager) CC.AudioManager.init();
    }, { once: true, passive: true });
});

// Suppress the long-press / right-click context menu over the game.
window.addEventListener('contextmenu', function(e) { e.preventDefault(); });
