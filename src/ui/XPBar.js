// ============================================================
// XPBar — a rounded progress bar showing XP toward Adult.
// Tick marks sit at the Hatchling and Adult thresholds so the
// "distance to evolve" is always legible. Can animate fills.
// ============================================================

window.CritterCodex.XPBar = class XPBar {
    // opts: { color, showTicks }
    constructor(scene, x, y, w, h, opts) {
        opts = opts || {};
        this.scene = scene;
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.color = (opts.color != null) ? opts.color : CC.COLORS.GOLD;
        this.showTicks = opts.showTicks !== false;

        this.g = scene.add.graphics();
        this.displayFrac = 0;   // 0..1 (XP / ADULT_XP)
        this.redraw();
    }

    setDepth(d) { this.g.setDepth(d); return this; }

    fracFor(xp) { return CC.util.clamp(xp / CC.CFG.ADULT_XP, 0, 1); }

    setXP(xp, animate) {
        var target = this.fracFor(xp);
        if (!animate) {
            this.displayFrac = target;
            this.redraw();
            return;
        }
        var self = this;
        this.scene.tweens.add({
            targets: this,
            displayFrac: target,
            duration: 420,
            ease: 'Cubic.easeOut',
            onUpdate: function() { self.redraw(); }
        });
    }

    redraw() {
        var g = this.g, x = this.x, y = this.y, w = this.w, h = this.h;
        var r = h / 2;
        g.clear();

        // Track
        g.fillStyle(CC.COLORS.INK, 0.55);
        g.fillRoundedRect(x, y, w, h, r);

        // Fill
        var fw = Math.max(0, w * this.displayFrac);
        if (fw > 1) {
            g.fillStyle(this.color, 1);
            g.fillRoundedRect(x, y, Math.max(fw, h), h, r);
            // Glossy top highlight
            g.fillStyle(CC.COLORS.WHITE, 0.18);
            g.fillRoundedRect(x + 2, y + 2, Math.max(fw - 4, 2), h * 0.4, r * 0.6);
        }

        // Threshold ticks (Hatchling, Adult)
        if (this.showTicks) {
            g.fillStyle(CC.COLORS.WHITE, 0.5);
            var hx = x + w * (CC.CFG.HATCHLING_XP / CC.CFG.ADULT_XP);
            g.fillRect(hx - 1, y + 2, 2, h - 4);
        }
    }

    destroy() { this.g.destroy(); }
};
