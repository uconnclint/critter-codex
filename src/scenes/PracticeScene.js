// ============================================================
// PracticeScene — the core loop, now for any operation.
//   • Operation + difficulty come from CC.session (set in Select).
//   • A smartly-chosen family (weighted to sleepy / low-mastery);
//     difficulty scales the varying number.
//   • Correct feeds that family's critter FOR THIS OPERATION: XP,
//     juicy feedback, speed + difficulty bonus, evolution moments.
//   • Wrong never punishes: shows the answer kindly and moves on.
// ============================================================

class PracticeScene extends Phaser.Scene {
    constructor() { super({ key: 'PracticeScene' }); }

    create() {
        const W = CC.WIDTH, H = CC.HEIGHT;
        this.cameras.main.setBackgroundColor(CC.COLORS.BG);

        this.op = CC.session.op;
        this.difficulty = CC.session.difficulty;
        this.locked = false;
        this.current = null;
        this.startTime = 0;
        this.answerButtons = [];
        this.streak = 0;

        var opDef = CC.opByKey(this.op);
        var diffDef = CC.diffByKey(this.difficulty);

        // ── Top bar ──
        this.makeChip(70, 40, '‹ Menu', () => this.scene.start('MenuScene'));
        // Center label doubles as a "change operation/difficulty" button.
        this.makeChip(W / 2, 40, opDef.symbol + '  ' + opDef.label + '  ·  ' + diffDef.label + '   ⚙', () => this.scene.start('SelectScene'), opDef.colorHex);
        this.makeChip(W - 80, 40, 'Codex', () => this.scene.start('CodexScene'));
        this.makeMute(170, 40);

        // Streak + review labels (left/main area)
        this.streakTxt = this.add.text(this.cxMain || 350, 120, '', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '800', color: CC.HEX.GOLD
        }).setOrigin(0.5);
        this.reviewTxt = this.add.text(this.cxMain || 350, 162, '', {
            fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '800', color: CC.HEX.SLEEPY
        }).setOrigin(0.5);

        // Keyboard: press 1–4 to choose an answer.
        this.input.keyboard.on('keydown', (e) => {
            if (this.locked) return;
            var idx = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
            if (idx != null && this.answerButtons[idx]) this.answer(this.answerButtons[idx]);
        });

        // ── Side panel (active critter + live XP) ──
        var panel = this.add.graphics();
        panel.fillStyle(CC.COLORS.PANEL, 1);
        panel.fillRoundedRect(700, 90, 300, 600, 22);
        this.sideX = 850;

        this.sideCreature = null;
        this.sideName = this.add.text(this.sideX, 360, '', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '30px', fontStyle: '800', color: CC.HEX.CREAM
        }).setOrigin(0.5);
        this.sideStage = this.add.text(this.sideX, 398, '', {
            fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        this.sideBiome = this.add.text(this.sideX, 430, '', {
            fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);
        this.xpBar = new CC.XPBar(this, this.sideX - 120, 470, 240, 22, { color: CC.COLORS.GOLD });
        this.xpLabel = this.add.text(this.sideX, 512, '', {
            fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '700', color: CC.HEX.MUTED
        }).setOrigin(0.5);

        // ── Prompt + feedback (left main area) ──
        this.cxMain = 350;
        this.promptTxt = this.add.text(this.cxMain, 230, '', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '76px', fontStyle: '800',
            color: CC.HEX.CREAM, stroke: CC.HEX.INK, strokeThickness: 8
        }).setOrigin(0.5);
        this.feedbackTxt = this.add.text(this.cxMain, 318, '', {
            fontFamily: '"Nunito", sans-serif', fontSize: '24px', fontStyle: '800', color: CC.HEX.SUCCESS
        }).setOrigin(0.5);

        this.nextQuestion();
    }

    // ── Rebuild the side panel for the active family (this op) ──
    setActiveFamily(family) {
        var sp = CC.species(this.op, family);
        var st = CC.MasteryEngine.getState(this.op, family);
        var stage = CC.MasteryEngine.stageOf(this.op, family);

        if (this.sideCreature) this.sideCreature.destroy();
        this.sideCreature = CC.makeCreature(this, this.op, family, stage)
            .setPosition(this.sideX, 250).setDisplaySize(210, 210);

        this.sideName.setText(sp.names[CC.STAGES.indexOf(stage)]).setColor(sp.colorHex);
        this.sideStage.setText(CC.STAGE_LABEL[stage]);
        this.sideBiome.setText(CC.opByKey(this.op).symbol + family + '  ·  ' + sp.biome);
        this.xpBar.color = sp.color;
        this.xpBar.setXP(st.xp, false);
        this.xpLabel.setText(st.xp + ' XP');
    }

    // ── Build the four answer buttons ──
    buildAnswers(options) {
        this.answerButtons.forEach(b => b.box.destroy());
        this.answerButtons = [];

        var bw = 250, bh = 116, gap = 28;
        var cx = this.cxMain, cy = 510;
        var slots = [
            [cx - bw / 2 - gap / 2, cy - bh / 2 - gap / 2],
            [cx + bw / 2 + gap / 2, cy - bh / 2 - gap / 2],
            [cx - bw / 2 - gap / 2, cy + bh / 2 + gap / 2],
            [cx + bw / 2 + gap / 2, cy + bh / 2 + gap / 2]
        ];

        options.forEach((val, i) => {
            var x = slots[i][0], y = slots[i][1];
            var box = this.add.container(x, y);
            var g = this.add.graphics();
            this.paintButton(g, bw, bh, CC.COLORS.PANEL_HI);
            var txt = this.add.text(0, 0, String(val), {
                fontFamily: '"Baloo 2", sans-serif', fontSize: '52px', fontStyle: '800', color: CC.HEX.CREAM
            }).setOrigin(0.5);
            // Small keyboard hint (1–4) in the corner.
            var hint = this.add.text(-bw / 2 + 14, -bh / 2 + 10, String(i + 1), {
                fontFamily: '"Nunito", sans-serif', fontSize: '15px', fontStyle: '800', color: CC.HEX.MUTED
            }).setOrigin(0, 0);
            box.add([g, txt, hint]);
            box.setSize(bw, bh).setInteractive({ useHandCursor: true });

            var btn = { box: box, g: g, txt: txt, value: val, w: bw, h: bh };
            box.on('pointerover', () => { if (!this.locked) this.tweens.add({ targets: box, scale: 1.04, duration: 80 }); });
            box.on('pointerout',  () => { if (!this.locked) this.tweens.add({ targets: box, scale: 1, duration: 80 }); });
            box.on('pointerdown', () => this.answer(btn));
            this.answerButtons.push(btn);
        });
    }

    paintButton(g, w, h, fill) {
        g.clear();
        g.fillStyle(CC.COLORS.INK, 0.35);
        g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 18);
        g.fillStyle(fill, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    }

    // ── Next question ──
    nextQuestion() {
        this.locked = false;
        this.feedbackTxt.setText('').setColor(CC.HEX.SUCCESS);

        var fact = CC.MasteryEngine.pickFact(this.op, this.difficulty, Date.now());
        this.current = fact;
        this.setActiveFamily(fact.family);

        this.promptTxt.setText(fact.prompt + ' = ?');
        this.promptTxt.setScale(0.9);
        this.tweens.add({ targets: this.promptTxt, scale: 1, duration: 160, ease: 'Back.easeOut' });

        // Flag re-surfaced ("review") facts so the practice feels intentional.
        this.reviewTxt.setText(fact.review ? '🔁 Review — you missed this one' : '');

        var opts = CC.DistractorGenerator.options(fact.answer, fact.n1, fact.n2, fact.op);
        this.buildAnswers(opts);
        this.startTime = this.time.now;
    }

    // ── Handle an answer ──
    answer(btn) {
        if (this.locked) return;
        this.locked = true;

        var fact = this.current;
        var elapsed = this.time.now - this.startTime;
        var correct = (btn.value === fact.answer);
        var res = CC.MasteryEngine.award(fact, correct, elapsed, Date.now());
        CC.MasteryEngine.save();

        if (correct) {
            this.paintButton(btn.g, btn.w, btn.h, CC.COLORS.SUCCESS);
            btn.txt.setColor(CC.HEX.INK);
            if (res.fast) {
                CC.AudioManager.fast();
                this.feedbackTxt.setText('Fast! +' + res.gained + ' XP').setColor(CC.HEX.GOLD);
            } else {
                CC.AudioManager.correct();
                this.feedbackTxt.setText('+' + res.gained + ' XP').setColor(CC.HEX.SUCCESS);
            }
            CC.FloatingText(this, btn.box.x, btn.box.y - 20,
                '+' + res.gained, { color: res.fast ? CC.HEX.GOLD : CC.HEX.SUCCESS });

            var st = CC.MasteryEngine.getState(this.op, fact.family);
            this.xpBar.setXP(st.xp, true);
            this.xpLabel.setText(st.xp + ' XP');

            // Streak
            this.streak += 1;
            this.updateStreak();
            if (this.streak % 5 === 0) {
                CC.AudioManager.streak();
                CC.FloatingText(this, this.cxMain, 180,
                    this.streak + ' in a row! 🔥', { color: CC.HEX.GOLD, size: 34 });
            }

            if (res.evolved) {
                // Side-panel swap + sparkles, then a full-screen celebration
                // moment; the next question waits until it's dismissed.
                this.playEvolution(fact.family, res.newStage);
                var self = this;
                new CC.EvolutionCelebration(this, this.op, fact.family, res.newStage,
                    function() { self.nextQuestion(); });
            } else {
                this.time.delayedCall(750, () => this.nextQuestion());
            }
        } else {
            this.streak = 0;
            this.updateStreak();
            CC.AudioManager.gentleWrong();
            this.paintButton(btn.g, btn.w, btn.h, CC.COLORS.GENTLE);
            btn.txt.setColor(CC.HEX.INK);
            this.answerButtons.forEach(b => {
                if (b.value === fact.answer) {
                    this.paintButton(b.g, b.w, b.h, CC.COLORS.SUCCESS);
                    b.txt.setColor(CC.HEX.INK);
                }
            });
            this.feedbackTxt
                .setText(fact.prompt + ' = ' + fact.answer + '  ·  your critter still loves you 💛')
                .setColor(CC.HEX.GENTLE);
            this.time.delayedCall(1700, () => this.nextQuestion());
        }
    }

    // ── Evolution moment ──
    playEvolution(family, newStage) {
        var sp = CC.species(this.op, family);

        var c = this.sideCreature;
        this.tweens.add({
            targets: c, scale: c.scale * 1.4, duration: 220, yoyo: true, ease: 'Quad.easeOut',
            onYoyo: () => {
                c.destroy();
                this.sideCreature = CC.makeCreature(this, this.op, family, newStage)
                    .setPosition(this.sideX, 250).setDisplaySize(210, 210);
                this.sideName.setText(sp.names[CC.STAGES.indexOf(newStage)]).setColor(sp.colorHex);
                this.sideStage.setText(CC.STAGE_LABEL[newStage]);
            }
        });

        CC.AudioManager.evolve();

        for (var i = 0; i < 10; i++) {
            var ang = (Math.PI * 2 / 10) * i;
            var star = this.add.text(this.sideX, 250, '✦', {
                fontFamily: 'sans-serif', fontSize: '26px', color: sp.colorHex
            }).setOrigin(0.5).setDepth(50);
            this.tweens.add({
                targets: star,
                x: this.sideX + Math.cos(ang) * 130,
                y: 250 + Math.sin(ang) * 130,
                alpha: 0, duration: 700, ease: 'Cubic.easeOut',
                onComplete: () => star.destroy()
            });
        }

        // (The full-screen EvolutionCelebration overlay handles the messaging.)
    }

    // ── Streak label ──
    updateStreak() {
        this.streakTxt.setText(this.streak >= 2 ? '🔥 Streak: ' + this.streak : '');
    }

    // ── Mute toggle ──
    makeMute(x, y) {
        var txt = this.add.text(x, y, CC.AudioManager.isMuted() ? '🔇' : '🔊', {
            fontFamily: 'sans-serif', fontSize: '24px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => {
            CC.AudioManager.init();
            var m = CC.AudioManager.toggleMuted();
            txt.setText(m ? '🔇' : '🔊');
        });
        return txt;
    }

    // ── Top-bar pill ──
    makeChip(x, y, label, onClick, textHex) {
        var box = this.add.container(x, y);
        var baseColor = textHex || CC.HEX.MUTED;
        var txt = this.add.text(0, 0, label, {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '700', color: baseColor
        }).setOrigin(0.5);
        var w = Math.max(txt.width + 36, 44), h = 44;
        var g = this.add.graphics();
        g.fillStyle(CC.COLORS.PANEL_HI, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        box.add([g, txt]);
        box.setSize(w, h).setInteractive({ useHandCursor: true });
        box.on('pointerover', () => txt.setColor(CC.HEX.CREAM));
        box.on('pointerout',  () => txt.setColor(baseColor));
        box.on('pointerdown', () => { CC.AudioManager.tap(); onClick(); });
        return box;
    }
}
