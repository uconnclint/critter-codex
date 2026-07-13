// ============================================================
// MenuScene — title, decorative critters, Practice / Codex.
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const W = CC.WIDTH, H = CC.HEIGHT;
        this.cameras.main.setBackgroundColor(CC.COLORS.BG);

        // ── Decorative critters bobbing around the title ──
        // A spread across all four operation sets, at their best stage.
        var deco = [
            { op: 'mul', f: 2, s: 'adult',     x: 150, y: 180, scale: 130 },
            { op: 'add', f: 6, s: 'adult',     x: 875, y: 175, scale: 140 },
            { op: 'div', f: 5, s: 'hatchling', x: 230, y: 470, scale: 110 },
            { op: 'sub', f: 9, s: 'adult',     x: 800, y: 500, scale: 120 },
            { op: 'add', f: 3, s: 'hatchling', x: 120, y: 640, scale: 95  },
            { op: 'div', f: 8, s: 'adult',     x: 905, y: 650, scale: 105 }
        ];
        deco.forEach((d, i) => {
            var c = CC.makeCreature(this, d.op, d.f, d.s).setPosition(d.x, d.y).setDisplaySize(d.scale, d.scale);
            c.setAngle(-4 + (i % 3) * 4);
            this.tweens.add({
                targets: c, y: d.y - 14, duration: 1600 + i * 180,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        });

        // ── Title ──
        this.add.text(W / 2, 250, 'Critter Codex', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '76px', fontStyle: '800',
            color: CC.HEX.GOLD, stroke: CC.HEX.INK, strokeThickness: 10
        }).setOrigin(0.5);
        this.add.text(W / 2, 312, 'Feed your critters. Master your math facts.', {
            fontFamily: '"Nunito", sans-serif', fontSize: '22px', fontStyle: '700',
            color: CC.HEX.MUTED
        }).setOrigin(0.5);

        // ── Buttons ──
        this.makeButton(W / 2, 420, 300, 76, 'Practice', CC.COLORS.GOLD, CC.HEX.INK, () => {
            CC.AudioManager.init();
            this.scene.start('SelectScene');
        });
        this.makeButton(W / 2, 512, 300, 68, 'Codex', CC.COLORS.PANEL_HI, CC.HEX.CREAM, () => {
            CC.AudioManager.init();
            this.scene.start('CodexScene');
        });

        // ── "Your critters miss you" return hook ──
        var sleepy = CC.MasteryEngine.totalSleepy(Date.now());
        if (sleepy > 0) {
            this.add.text(W / 2, 588,
                '💤 ' + sleepy + (sleepy === 1 ? ' critter misses' : ' critters miss') + ' you — time to practice!', {
                fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '800', color: CC.HEX.SLEEPY
            }).setOrigin(0.5);
        }

        // ── Mute toggle (top-right) ──
        this.muteChip = this.makeMute(W - 56, 44);
    }

    makeMute(x, y) {
        var label = CC.AudioManager.isMuted() ? '🔇' : '🔊';
        var txt = this.add.text(x, y, label, {
            fontFamily: 'sans-serif', fontSize: '26px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => {
            CC.AudioManager.init();
            var m = CC.AudioManager.toggleMuted();
            txt.setText(m ? '🔇' : '🔊');
        });
        return txt;
    }

    // Rounded button with label + hover/press feedback.
    // Built inside a centered container so scaling pivots on the button.
    makeButton(x, y, w, h, label, fillColor, textColor, onClick) {
        var box = this.add.container(x, y);
        var g = this.add.graphics();
        g.fillStyle(CC.COLORS.INK, 0.35);
        g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 18);
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);

        var txt = this.add.text(0, 0, label, {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '34px', fontStyle: '800',
            color: textColor
        }).setOrigin(0.5);

        box.add([g, txt]);
        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerover', () => this.tweens.add({ targets: box, scale: 1.05, duration: 90 }));
        box.on('pointerout',  () => this.tweens.add({ targets: box, scale: 1, duration: 90 }));
        box.on('pointerdown', () => { CC.AudioManager.tap(); onClick(); });
        return box;
    }
}
