// ============================================================
// ProgressPanel — at-a-glance mastery dashboard (teacher/parent).
// One row per operation: mastery %, a bar, and Egg/Hatchling/Adult
// counts; plus an overall "critters grown" total.
// ============================================================

window.CritterCodex.ProgressPanel = class ProgressPanel {
    constructor(scene) {
        this.scene = scene;
        var W = CC.WIDTH, H = CC.HEIGHT;
        var now = Date.now();

        var layer = scene.add.container(0, 0).setDepth(1100);
        this.layer = layer;

        var backdrop = scene.add.rectangle(0, 0, W, H, CC.COLORS.INK, 0.62)
            .setOrigin(0).setInteractive();
        backdrop.on('pointerdown', () => this.close());
        layer.add(backdrop);

        var pw = 720, ph = 560, px = W / 2, py = H / 2;
        var left = px - pw / 2, top = py - ph / 2;
        var panel = scene.add.graphics();
        panel.fillStyle(CC.COLORS.PANEL, 1);
        panel.fillRoundedRect(left, top, pw, ph, 22);
        panel.lineStyle(4, CC.COLORS.GOLD, 1);
        panel.strokeRoundedRect(left, top, pw, ph, 22);
        layer.add(panel);

        layer.add(scene.add.text(px, top + 40, 'Progress', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '34px', fontStyle: '800', color: CC.HEX.GOLD
        }).setOrigin(0.5));

        // One row per operation
        CC.OPERATIONS.forEach((op, i) => {
            var y = top + 110 + i * 92;
            var pct = Math.round(CC.MasteryEngine.opMastery(op.key) * 100);
            var counts = CC.MasteryEngine.stageCounts(op.key);

            layer.add(scene.add.text(left + 40, y, op.symbol + ' ' + op.label, {
                fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '700', color: op.colorHex
            }).setOrigin(0, 0.5));

            // Mastery bar
            var bx = left + 260, bw = 300, bh = 18, by = y - bh / 2;
            var bar = scene.add.graphics();
            bar.fillStyle(CC.COLORS.INK, 0.55);
            bar.fillRoundedRect(bx, by, bw, bh, bh / 2);
            if (pct > 0) {
                bar.fillStyle(op.color, 1);
                bar.fillRoundedRect(bx, by, Math.max(bw * pct / 100, bh), bh, bh / 2);
            }
            layer.add(bar);
            layer.add(scene.add.text(bx + bw + 16, y, pct + '%', {
                fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '800', color: CC.HEX.CREAM
            }).setOrigin(0, 0.5));

            // Stage counts
            layer.add(scene.add.text(left + 40, y + 26,
                '🥚 ' + counts.egg + '    🐣 ' + counts.hatchling + '    ⭐ ' + counts.adult, {
                fontFamily: '"Nunito", sans-serif', fontSize: '15px', fontStyle: '700', color: CC.HEX.MUTED
            }).setOrigin(0, 0.5));
        });

        // Footer totals
        var adults = CC.MasteryEngine.totalAdults();
        var sleepy = CC.MasteryEngine.totalSleepy(now);
        layer.add(scene.add.text(px, top + ph - 42,
            'Critters fully grown: ' + adults + ' / 32' +
            (sleepy > 0 ? '      ·      💤 ' + sleepy + ' need practice' : ''), {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '20px', fontStyle: '700', color: CC.HEX.CREAM
        }).setOrigin(0.5));

        var close = scene.add.text(left + pw - 30, top + 28, '✕', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '28px', fontStyle: '800', color: CC.HEX.MUTED
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => this.close());
        layer.add(close);

        layer.setScale(0.94).setAlpha(0);
        scene.tweens.add({ targets: layer, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    }

    close() {
        var layer = this.layer;
        this.scene.tweens.add({
            targets: layer, alpha: 0, duration: 140,
            onComplete: function() { layer.destroy(); }
        });
    }
};
