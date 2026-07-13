// ============================================================
// DetailPanel — full-screen overlay for a single Codex entry.
// Creature, name line, stage, biome, mastery %, and the full
// ×1..×10 fact list. Tapping the backdrop or ✕ closes it.
// ============================================================

window.CritterCodex.DetailPanel = class DetailPanel {
    constructor(scene, op, family) {
        this.scene = scene;
        var sp = CC.species(op, family);
        var opDef = CC.opByKey(op);
        var st = CC.MasteryEngine.getState(op, family);
        var stage = CC.MasteryEngine.stageOf(op, family);
        var W = CC.WIDTH, H = CC.HEIGHT;

        var layer = scene.add.container(0, 0).setDepth(1000);
        this.layer = layer;

        // Backdrop (click to close)
        var backdrop = scene.add.rectangle(0, 0, W, H, CC.COLORS.INK, 0.62)
            .setOrigin(0).setInteractive();
        backdrop.on('pointerdown', () => this.close());
        layer.add(backdrop);

        // Panel
        var pw = 660, ph = 540, px = W / 2, py = H / 2;
        var panel = scene.add.graphics();
        panel.fillStyle(CC.COLORS.PANEL, 1);
        panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 22);
        panel.lineStyle(5, sp.color, 1);
        panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 22);
        layer.add(panel);

        var left = px - pw / 2;
        var top  = py - ph / 2;

        // ── Left column: creature + identity ──
        var cx = left + 150;
        var creature = CC.makeCreature(scene, op, family, stage);
        creature.setPosition(cx, top + 150).setDisplaySize(190, 190);
        layer.add(creature);

        var names = sp.names;
        var nameTxt = scene.add.text(cx, top + 268, names[CC.STAGES.indexOf(stage)], {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '32px', fontStyle: '800',
            color: sp.colorHex
        }).setOrigin(0.5);
        layer.add(nameTxt);

        var stageTxt = scene.add.text(cx, top + 304,
            CC.STAGE_LABEL[stage] + (CC.MasteryEngine.isSleepy(op, family, Date.now()) ? '  ·  💤 sleepy' : ''), {
            fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '700',
            color: CC.HEX.MUTED
        }).setOrigin(0.5);
        layer.add(stageTxt);

        var biomeTxt = scene.add.text(cx, top + 338, opDef.symbol + ' ' + opDef.label + '  ·  ' + sp.biome, {
            fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '700',
            color: opDef.colorHex
        }).setOrigin(0.5);
        layer.add(biomeTxt);

        // Mastery %
        var pct = Math.round(CC.MasteryEngine.masteryPercent(op, family) * 100);
        var bar = new CC.XPBar(scene, cx - 130, top + 380, 260, 16, { color: sp.color });
        bar.setXP(st.xp, false);
        layer.add(bar.g);
        var pctTxt = scene.add.text(cx, top + 412, 'Mastery ' + pct + '%', {
            fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '700',
            color: CC.HEX.MUTED
        }).setOrigin(0.5);
        layer.add(pctTxt);

        // ── Right column: full fact list ──
        var rx = left + 330;
        var heading = scene.add.text(rx + 150, top + 40, 'Known facts', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '24px', fontStyle: '700',
            color: CC.HEX.CREAM
        }).setOrigin(0.5);
        layer.add(heading);

        var facts = CC.factsForFamily(op, family);   // 10 strings for this operation
        for (var i = 0; i < facts.length; i++) {
            var col = i < 5 ? 0 : 1;
            var row = i % 5;
            var fx = rx + 60 + col * 180;
            var fy = top + 90 + row * 52;
            var chip = scene.add.graphics();
            chip.fillStyle(CC.COLORS.PANEL_HI, 1);
            chip.fillRoundedRect(fx - 10, fy - 8, 160, 40, 10);
            layer.add(chip);
            var factTxt = scene.add.text(fx + 70, fy + 12, facts[i], {
                fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '800',
                color: CC.HEX.CREAM
            }).setOrigin(0.5);
            layer.add(factTxt);
        }

        // ── Close button ──
        var close = scene.add.text(px + pw / 2 - 30, top + 26, '✕', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '30px', fontStyle: '800',
            color: CC.HEX.MUTED
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        close.on('pointerover', () => close.setColor(CC.HEX.CREAM));
        close.on('pointerout',  () => close.setColor(CC.HEX.MUTED));
        close.on('pointerdown', () => this.close());
        layer.add(close);

        // Entrance pop
        layer.setScale(0.92).setAlpha(0);
        scene.tweens.add({ targets: layer, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    }

    close() {
        var layer = this.layer;
        this.scene.tweens.add({
            targets: layer, scale: 0.92, alpha: 0, duration: 140, ease: 'Cubic.easeIn',
            onComplete: function() { layer.destroy(); }
        });
    }
};
