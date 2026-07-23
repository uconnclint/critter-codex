// ============================================================
// CodexScene — the collection at a glance, and the teacher's
// formative-assessment dashboard. 4×2 grid of species cards;
// tap a card for its DetailPanel; the ⚙ opens teacher tools.
// ============================================================

class CodexScene extends Phaser.Scene {
    constructor() { super({ key: 'CodexScene' }); }

    create() {
        const W = CC.WIDTH, H = CC.HEIGHT;
        this.cameras.main.setBackgroundColor(CC.COLORS.BG);

        // Which operation's progress this Codex page is showing.
        this.codexOp = CC.session.op;

        // ── Top bar ──
        this.makeChip(70, 40, '‹ Menu', () => this.scene.start('MenuScene'));
        this.makeChip(W - 200, 40, 'Practice', () => this.scene.start('SelectScene'));
        this.makeChip(W - 70, 40, '⚙', () => this.openTeacherTools());

        this.add.text(W / 2, 40, 'Codex', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800', color: CC.HEX.GOLD
        }).setOrigin(0.5);

        // ── Operation tabs ──
        this.tabs = {};
        var tw = 168, tgap = 14;
        var total = CC.OPERATIONS.length * tw + (CC.OPERATIONS.length - 1) * tgap;
        var startX = W / 2 - total / 2 + tw / 2;
        CC.OPERATIONS.forEach((op, i) => {
            var x = startX + i * (tw + tgap);
            this.tabs[op.key] = this.makeTab(x, 108, tw, 48, op, () => {
                this.codexOp = op.key;
                this.refreshTabs();
                this.renderCards();
            });
        });
        this.refreshTabs();

        this.cardLayer = this.add.container(0, 0);
        this.renderCards();
    }

    makeTab(x, y, w, h, op, onClick) {
        var box = this.add.container(x, y);
        var g = this.add.graphics();
        var txt = this.add.text(0, 0, op.symbol + ' ' + op.label, {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '18px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        box.add([g, txt]);
        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => { CC.AudioManager.tap(); onClick(); });
        return { box: box, g: g, txt: txt, op: op, w: w, h: h };
    }

    refreshTabs() {
        var self = this;
        CC.OPERATIONS.forEach(function(op) {
            var t = self.tabs[op.key];
            var on = (op.key === self.codexOp);
            t.g.clear();
            t.g.fillStyle(on ? op.color : CC.COLORS.PANEL_HI, 1);
            t.g.fillRoundedRect(-t.w / 2, -t.h / 2, t.w, t.h, 12);
            t.txt.setColor(on ? CC.HEX.INK : CC.HEX.MUTED);
        });
    }

    // ── Card grid ──
    renderCards() {
        this.cardLayer.removeAll(true);
        var now = Date.now();
        var cardW = 210, cardH = 250;
        var colX = [183, 417, 651, 885];
        var rowY = [300, 578];

        CC.speciesList(this.codexOp).forEach((sp, i) => {
            var col = i % 4, row = Math.floor(i / 4);
            this.buildCard(sp, colX[col], rowY[row], cardW, cardH, now);
        });
    }

    buildCard(sp, x, y, w, h, now) {
        var family = sp.family;
        var op = this.codexOp;
        var st = CC.MasteryEngine.getState(op, family);
        var stage = CC.MasteryEngine.stageOf(op, family);
        var sleepy = CC.MasteryEngine.isSleepy(op, family, now);

        var box = this.add.container(x, y);

        var g = this.add.graphics();
        g.fillStyle(CC.COLORS.INK, 0.3);
        g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 18);
        g.fillStyle(CC.COLORS.PANEL, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
        g.lineStyle(4, sp.color, stage === 'egg' ? 0.35 : 1);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
        box.add(g);

        var creature = CC.makeCreature(this, op, family, stage)
            .setPosition(0, -52).setDisplaySize(118, 118);
        box.add(creature);

        var name = this.add.text(0, 28, sp.names[CC.STAGES.indexOf(stage)], {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '24px', fontStyle: '800', color: sp.colorHex
        }).setOrigin(0.5);
        box.add(name);

        var meta = this.add.text(0, 56, CC.opByKey(op).symbol + family + '  ·  ' + CC.STAGE_LABEL[stage], {
            fontFamily: '"Nunito", sans-serif', fontSize: '15px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        box.add(meta);

        // Mini XP bar — local coords relative to the card container so it
        // sits above the panel and scales with the card on hover.
        var bar = new CC.XPBar(this, -80, 82, 160, 14, { color: sp.color });
        bar.setXP(st.xp, false);
        box.add(bar.g);

        // Sleepy badge.
        if (sleepy) {
            var badge = this.add.text(w / 2 - 22, -h / 2 + 22, '💤', {
                fontFamily: 'sans-serif', fontSize: '24px'
            }).setOrigin(0.5);
            box.add(badge);
        }

        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerover', () => this.tweens.add({ targets: box, scale: 1.03, duration: 90 }));
        box.on('pointerout',  () => this.tweens.add({ targets: box, scale: 1, duration: 90 }));
        box.on('pointerdown', () => { CC.AudioManager.tap(); new CC.DetailPanel(this, op, family); });

        this.cardLayer.add(box);
    }

    // ── Teacher tools overlay ──
    openTeacherTools() {
        const W = CC.WIDTH, H = CC.HEIGHT;
        var layer = this.add.container(0, 0).setDepth(1000);

        var backdrop = this.add.rectangle(0, 0, W, H, CC.COLORS.INK, 0.6).setOrigin(0).setInteractive();
        backdrop.on('pointerdown', () => layer.destroy());
        layer.add(backdrop);

        var pw = 420, ph = 400, px = W / 2, py = H / 2;
        var panel = this.add.graphics();
        panel.fillStyle(CC.COLORS.PANEL, 1);
        panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 20);
        panel.lineStyle(4, CC.COLORS.GOLD, 1);
        panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 20);
        layer.add(panel);

        layer.add(this.add.text(px, py - ph / 2 + 40, '⚙ Teacher tools', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '28px', fontStyle: '800', color: CC.HEX.CREAM
        }).setOrigin(0.5));

        var CEP = window.CEP;
        var btnOpts = { width: 320, height: 60, fontSize: 24, fontFamily: '"Baloo 2", sans-serif', settings: window.CE.settings };

        var b0 = CEP.button(this, px, py - 78, '📊 View progress', () => {
            CC.AudioManager.tap();
            layer.destroy();
            new CC.ProgressPanel(this);
        }, { ...btnOpts, fill: CC.COLORS.GOLD, textColor: CC.HEX.INK });
        layer.add(b0);

        var b1 = CEP.button(this, px, py + 2, 'Simulate a day', () => {
            CC.AudioManager.tap();
            CC.MasteryEngine.simulateDay(Date.now());
            CC.MasteryEngine.save();
            layer.destroy();
            this.renderCards();
        }, { ...btnOpts, fill: CC.COLORS.PANEL_HI, textColor: CC.HEX.CREAM });
        layer.add(b1);

        var b2 = CEP.button(this, px, py + 82, 'Reset all progress', () => {
            CC.AudioManager.tap();
            CC.MasteryEngine.reset();
            layer.destroy();
            this.renderCards();
        }, { ...btnOpts, fill: CC.COLORS.PANEL_HI, textColor: '#e88a8a' });
        layer.add(b2);

        var close = this.add.text(px + pw / 2 - 26, py - ph / 2 + 26, '✕', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '26px', fontStyle: '800', color: CC.HEX.MUTED
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => layer.destroy());
        layer.add(close);
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
