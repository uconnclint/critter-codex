// ============================================================
// EvolutionCelebration — full-screen "new form!" moment.
// Shows the evolved critter big, with a PLACEHOLDER reward card
// (content from CC.getEvolutionReward — to be designed later).
// Tap anywhere / Continue to dismiss; calls onClose once.
// ============================================================

window.CritterCodex.EvolutionCelebration = class EvolutionCelebration {
    constructor(scene, op, family, newStage, onClose) {
        this.scene = scene;
        this.closed = false;
        this.onClose = onClose || function() {};
        var sp = CC.species(op, family);
        var opDef = CC.opByKey(op);
        var W = CC.WIDTH, H = CC.HEIGHT;

        var layer = scene.add.container(0, 0).setDepth(1200);
        this.layer = layer;

        var backdrop = scene.add.rectangle(0, 0, W, H, CC.COLORS.INK, 0.78)
            .setOrigin(0).setInteractive();
        backdrop.on('pointerdown', () => this.close());
        layer.add(backdrop);

        // Confetti-ish sparkle burst behind the critter
        for (var i = 0; i < 18; i++) {
            var ang = (Math.PI * 2 / 18) * i;
            var star = scene.add.text(W / 2, 250, '✦', {
                fontFamily: 'sans-serif', fontSize: '30px', color: sp.colorHex
            }).setOrigin(0.5);
            layer.add(star);
            scene.tweens.add({
                targets: star,
                x: W / 2 + Math.cos(ang) * (180 + (i % 3) * 30),
                y: 250 + Math.sin(ang) * (160 + (i % 3) * 30),
                alpha: 0, duration: 900, ease: 'Cubic.easeOut'
            });
        }

        // Title
        var title = scene.add.text(W / 2, 90, 'New form unlocked!', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800',
            color: CC.HEX.GOLD, stroke: CC.HEX.INK, strokeThickness: 8
        }).setOrigin(0.5);
        layer.add(title);

        // The evolved critter, big (pops in)
        var creature = CC.makeCreature(scene, op, family, newStage)
            .setPosition(W / 2, 270).setDisplaySize(10, 10);
        layer.add(creature);
        scene.tweens.add({
            targets: creature, displayWidth: 280, displayHeight: 280,
            duration: 360, ease: 'Back.easeOut'
        });

        var name = scene.add.text(W / 2, 432, sp.names[CC.STAGES.indexOf(newStage)], {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800', color: sp.colorHex
        }).setOrigin(0.5);
        layer.add(name);
        var sub = scene.add.text(W / 2, 470,
            'reached the ' + CC.STAGE_LABEL[newStage] + ' stage   ·   ' + opDef.symbol + ' ' + opDef.label, {
            fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        layer.add(sub);

        // ── Reward card (PLACEHOLDER) ──
        var reward = CC.getEvolutionReward(op, family, newStage);
        var rw = 520, rh = 96, rx = W / 2, ry = 560;
        var card = scene.add.graphics();
        card.fillStyle(CC.COLORS.PANEL, 1);
        card.fillRoundedRect(rx - rw / 2, ry - rh / 2, rw, rh, 16);
        // dashed-ish placeholder accent
        card.lineStyle(3, CC.COLORS.GOLD, 0.8);
        card.strokeRoundedRect(rx - rw / 2, ry - rh / 2, rw, rh, 16);
        layer.add(card);
        layer.add(scene.add.text(rx, ry - 22, reward.title, {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '800', color: CC.HEX.GOLD
        }).setOrigin(0.5));
        layer.add(scene.add.text(rx, ry + 14, reward.body, {
            fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '700', color: CC.HEX.MUTED,
            align: 'center', wordWrap: { width: rw - 40 }
        }).setOrigin(0.5));

        // Continue button
        var by = 668, bw = 260, bh = 60;
        var btn = scene.add.container(W / 2, by);
        var bg = scene.add.graphics();
        bg.fillStyle(CC.COLORS.SUCCESS, 1);
        bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 16);
        var btxt = scene.add.text(0, 0, 'Continue', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '28px', fontStyle: '800', color: CC.HEX.INK
        }).setOrigin(0.5);
        btn.add([bg, btxt]);
        btn.setSize(bw, bh).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.close());
        layer.add(btn);

        layer.setAlpha(0);
        scene.tweens.add({ targets: layer, alpha: 1, duration: 200 });
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        var layer = this.layer, cb = this.onClose;
        this.scene.tweens.add({
            targets: layer, alpha: 0, duration: 160,
            onComplete: function() { layer.destroy(); cb(); }
        });
    }
};
