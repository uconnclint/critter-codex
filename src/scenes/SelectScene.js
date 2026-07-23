// ============================================================
// SelectScene — pick an operation, then a difficulty, then play.
// ============================================================

class SelectScene extends Phaser.Scene {
    constructor() { super({ key: 'SelectScene' }); }

    create() {
        const W = CC.WIDTH, H = CC.HEIGHT;
        this.cameras.main.setBackgroundColor(CC.COLORS.BG);

        this.selOp   = CC.session.op;
        this.selDiff = CC.session.difficulty;
        this.opCards = {};
        this.diffCards = {};

        this.makeChip(70, 40, '‹ Menu', () => this.scene.start('MenuScene'));

        this.add.text(W / 2, 70, 'What do you want to practice?', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800', color: CC.HEX.CREAM
        }).setOrigin(0.5);

        // ── Operation cards ──
        this.add.text(W / 2, 150, 'Operation', {
            fontFamily: '"Nunito", sans-serif', fontSize: '20px', fontStyle: '800', color: CC.HEX.MUTED
        }).setOrigin(0.5);

        var ow = 200, oh = 160, ogap = 28;
        var totalW = CC.OPERATIONS.length * ow + (CC.OPERATIONS.length - 1) * ogap;
        var startX = W / 2 - totalW / 2 + ow / 2;
        CC.OPERATIONS.forEach((op, i) => {
            var x = startX + i * (ow + ogap), y = 270;
            var card = this.makeCard(x, y, ow, oh, op.color, (box) => {
                var sym = this.add.text(0, -28, op.symbol, {
                    fontFamily: '"Baloo 2", sans-serif', fontSize: '72px', fontStyle: '800', color: op.colorHex
                }).setOrigin(0.5);
                var lbl = this.add.text(0, 44, op.label, {
                    fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '700', color: CC.HEX.CREAM
                }).setOrigin(0.5);
                box.add([sym, lbl]);
            }, () => this.selectOp(op.key));
            this.opCards[op.key] = card;
        });

        // ── Difficulty cards ──
        this.add.text(W / 2, 420, 'Difficulty', {
            fontFamily: '"Nunito", sans-serif', fontSize: '20px', fontStyle: '800', color: CC.HEX.MUTED
        }).setOrigin(0.5);

        var dw = 220, dh = 120, dgap = 18;
        var dTotal = CC.DIFFICULTIES.length * dw + (CC.DIFFICULTIES.length - 1) * dgap;
        var dStartX = W / 2 - dTotal / 2 + dw / 2;
        CC.DIFFICULTIES.forEach((d, i) => {
            var x = dStartX + i * (dw + dgap), y = 530;
            var card = this.makeCard(x, y, dw, dh, CC.COLORS.GOLD, (box) => {
                var lbl = this.add.text(0, -20, d.label, {
                    fontFamily: '"Baloo 2", sans-serif', fontSize: '30px', fontStyle: '800', color: CC.HEX.CREAM
                }).setOrigin(0.5);
                var blurb = this.add.text(0, 22, d.blurb, {
                    fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '700', color: CC.HEX.MUTED
                }).setOrigin(0.5);
                box.add([lbl, blurb]);
            }, () => this.selectDiff(d.key));
            this.diffCards[d.key] = card;
        });

        // ── Start (shared engine button factory — engine/phaser/ui.js) ──
        window.CEP.button(this, W / 2, 680, 'Start', () => {
            CC.AudioManager.tap();
            CC.session.op = this.selOp;
            CC.session.difficulty = this.selDiff;
            CC.MasteryEngine.save();
            this.scene.start('PracticeScene');
        }, {
            width: 320, height: 76, fill: CC.COLORS.SUCCESS, textColor: CC.HEX.INK,
            fontSize: 34, fontFamily: '"Baloo 2", sans-serif', settings: window.CE.settings
        });

        this.refreshSelection();
    }

    selectOp(key)   { this.selOp = key;   CC.AudioManager.tap(); this.refreshSelection(); }
    selectDiff(key) { this.selDiff = key; CC.AudioManager.tap(); this.refreshSelection(); }

    refreshSelection() {
        CC.OP_KEYS.forEach(k => this.opCards[k].setSelected(k === this.selOp));
        CC.DIFFICULTIES.forEach(d => this.diffCards[d.key].setSelected(d.key === this.selDiff));
    }

    // Returns { box, setSelected(bool) }. drawContent(box) adds children.
    makeCard(x, y, w, h, accent, drawContent, onClick) {
        var box = this.add.container(x, y);
        var g = this.add.graphics();
        g.fillStyle(CC.COLORS.PANEL, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
        var hi = this.add.graphics();   // selection highlight (toggled)
        box.add([g, hi]);
        drawContent(box);
        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerover', () => this.tweens.add({ targets: box, scale: 1.04, duration: 90 }));
        box.on('pointerout',  () => this.tweens.add({ targets: box, scale: 1, duration: 90 }));
        box.on('pointerdown', onClick);

        function setSelected(on) {
            hi.clear();
            if (on) {
                hi.lineStyle(5, accent, 1);
                hi.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
                hi.fillStyle(accent, 0.10);
                hi.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
            } else {
                hi.lineStyle(2, CC.COLORS.PANEL_HI, 1);
                hi.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
            }
        }
        return { box: box, setSelected: setSelected };
    }

    makeChip(x, y, label, onClick) {
        var box = this.add.container(x, y);
        var txt = this.add.text(0, 0, label, {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        var w = Math.max(txt.width + 36, 44), h = 44;
        var g = this.add.graphics();
        g.fillStyle(CC.COLORS.PANEL_HI, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        box.add([g, txt]);
        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerover', () => txt.setColor(CC.HEX.CREAM));
        box.on('pointerout',  () => txt.setColor(CC.HEX.MUTED));
        box.on('pointerdown', () => { CC.AudioManager.tap(); onClick(); });
        return box;
    }
}
