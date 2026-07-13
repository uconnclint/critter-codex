// ============================================================
// BootScene — load (optional real art), build placeholder
// textures, restore saved progress, then head to the Menu.
// ============================================================

class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        const W = CC.WIDTH, H = CC.HEIGHT;

        // ── Loading text ──
        this.add.text(W / 2, H / 2 - 10, 'Critter Codex', {
            fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800',
            color: CC.HEX.GOLD
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 36, 'Waking the critters…', {
            fontFamily: '"Nunito", sans-serif', fontSize: '18px', fontStyle: '700',
            color: CC.HEX.MUTED
        }).setOrigin(0.5);

        // ── Real creature art (optional) ──────────────────────
        // Drop PNGs into assets/ (filename = texKey + ".png"):
        //   Multiplication  x{family}_{stage}.png    (e.g. x6_adult.png)
        //   Add/Sub/Div     {op}{family}_{stage}.png (e.g. add6_adult.png)
        // makeCreature() prefers real art and falls back to placeholders,
        // so missing files are fine — they just keep their placeholder.
        CC.OP_KEYS.forEach(function(op) {
            CC.speciesList(op).forEach(function(sp) {
                CC.STAGES.forEach(function(stage) {
                    var key = CC.texKey(op, sp.family, stage);
                    this.load.image(key, 'assets/' + key + '.png');
                }, this);
            }, this);
        }, this);

        // Don't let a missing optional asset break the boot.
        this.load.on('loaderror', function() {});
    }

    create() {
        // Procedural placeholders for any creature without real art.
        CC.buildPlaceholderTextures(this);

        // Restore saved progress (per-device) into the engine.
        CC.MasteryEngine.init(CC.SaveManager.load());

        // Wait for web fonts so text measures correctly, then start.
        const self = this;
        let started = false;
        const go = function() {
            if (started) return;
            started = true;
            self.scene.start('MenuScene');
        };
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(go);
            // Safety fallback if fonts hang.
            this.time.delayedCall(1500, go);
        } else {
            this.time.delayedCall(200, go);
        }
    }
}
