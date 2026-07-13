// ============================================================
// makeCreature — creature sprites with a real-art fallback.
//
//   CC.buildPlaceholderTextures(scene)  — generate placeholder
//        textures for every operation × family × stage, at boot.
//   CC.makeCreature(scene, op, family, stage) — return an Image using
//        the real PNG if it was loaded, else the placeholder.
//
// Real art is keyed by CC.texKey(op, family, stage); placeholders by
// 'ph_' + that key. Because makeCreature prefers the real key,
// shipping art needs zero code changes.
// ============================================================

(function() {
    const TEX = 240;             // native placeholder texture size (px)
    CC.CREATURE_TEX = TEX;

    // ── Color helpers (operate on 0xRRGGBB integers) ──────────
    function adjust(hex, factor) {
        var r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
        r = CC.util.clamp(Math.round(r * factor), 0, 255);
        g = CC.util.clamp(Math.round(g * factor), 0, 255);
        b = CC.util.clamp(Math.round(b * factor), 0, 255);
        return (r << 16) | (g << 8) | b;
    }

    function starPoints(cx, cy, outer, inner, count) {
        var pts = [];
        for (var i = 0; i < count * 2; i++) {
            var r = (i % 2 === 0) ? outer : inner;
            var ang = (Math.PI / count) * i - Math.PI / 2;
            pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
        }
        return pts;
    }

    // ── Species motif (the distinguishing flourish) ───────────
    // Drawn at (x, y) scaled by s. `light`/`dark` are shaded tints.
    function drawMotif(g, family, x, y, s, base, light, dark) {
        switch (family) {
            case 2: // ★ star-cub
                g.fillStyle(light, 1);
                g.fillPoints(starPoints(x, y, 26 * s, 11 * s, 5), true);
                g.lineStyle(3, dark, 1);
                g.strokePoints(starPoints(x, y, 26 * s, 11 * s, 5), true);
                break;
            case 3: // 🌿 leafy sprout
                g.fillStyle(light, 1);
                g.fillEllipse(x - 12 * s, y - 6 * s, 26 * s, 14 * s);
                g.fillEllipse(x + 12 * s, y - 6 * s, 26 * s, 14 * s);
                g.lineStyle(4, dark, 1);
                g.lineBetween(x, y + 8 * s, x, y - 18 * s);
                break;
            case 4: // 💎 crystal shards
                [[-16, 0], [0, -8], [16, 0]].forEach(function(o) {
                    g.fillStyle(light, 1);
                    g.fillPoints([
                        { x: x + o[0] * s,        y: y + o[1] * s - 22 * s },
                        { x: x + o[0] * s + 10 * s, y: y + o[1] * s },
                        { x: x + o[0] * s,        y: y + o[1] * s + 6 * s },
                        { x: x + o[0] * s - 10 * s, y: y + o[1] * s }
                    ], true);
                });
                break;
            case 5: // 💧 water droplet
                g.fillStyle(light, 1);
                g.fillCircle(x, y, 16 * s);
                g.fillTriangle(x - 12 * s, y - 4 * s, x + 12 * s, y - 4 * s, x, y - 28 * s);
                g.fillStyle(CC.COLORS.WHITE, 0.6);
                g.fillCircle(x - 5 * s, y - 2 * s, 5 * s);
                break;
            case 6: // 🔥 flame tip
                g.fillStyle(dark, 1);
                g.fillTriangle(x - 16 * s, y + 10 * s, x + 16 * s, y + 10 * s, x, y - 30 * s);
                g.fillStyle(light, 1);
                g.fillTriangle(x - 9 * s, y + 8 * s, x + 9 * s, y + 8 * s, x, y - 16 * s);
                break;
            case 7: // ☁ cloud + bolt
                g.fillStyle(light, 1);
                g.fillCircle(x - 14 * s, y, 12 * s);
                g.fillCircle(x + 14 * s, y, 12 * s);
                g.fillCircle(x, y - 8 * s, 16 * s);
                g.fillStyle(CC.COLORS.GOLD, 1);
                g.fillPoints([
                    { x: x + 2 * s, y: y - 4 * s }, { x: x - 8 * s, y: y + 14 * s },
                    { x: x,         y: y + 12 * s }, { x: x - 6 * s, y: y + 30 * s },
                    { x: x + 12 * s, y: y + 4 * s }, { x: x + 3 * s, y: y + 6 * s }
                ], true);
                break;
            case 8: // 🐝 wings + stripe
                g.fillStyle(light, 0.55);
                g.fillEllipse(x - 22 * s, y - 4 * s, 26 * s, 38 * s);
                g.fillEllipse(x + 22 * s, y - 4 * s, 26 * s, 38 * s);
                g.fillStyle(dark, 1);
                g.fillRect(x - 18 * s, y + 4 * s, 36 * s, 7 * s);
                break;
            case 9: // ❄ icicle spikes
                [-18, 0, 18].forEach(function(dx, i) {
                    var h = (i === 1) ? 30 : 22;
                    g.fillStyle(light, 1);
                    g.fillTriangle(
                        x + dx * s - 8 * s, y,
                        x + dx * s + 8 * s, y,
                        x + dx * s,         y - h * s
                    );
                });
                break;
        }
    }

    // ── Eyes + smile (friendly face shared across the set) ────
    function drawFace(g, cx, cy, eyeR, spread) {
        // Whites
        g.fillStyle(CC.COLORS.WHITE, 1);
        g.fillCircle(cx - spread, cy, eyeR);
        g.fillCircle(cx + spread, cy, eyeR);
        // Pupils
        g.fillStyle(CC.COLORS.INK, 1);
        g.fillCircle(cx - spread, cy + eyeR * 0.12, eyeR * 0.55);
        g.fillCircle(cx + spread, cy + eyeR * 0.12, eyeR * 0.55);
        // Catch-light
        g.fillStyle(CC.COLORS.WHITE, 0.9);
        g.fillCircle(cx - spread + eyeR * 0.22, cy - eyeR * 0.18, eyeR * 0.2);
        g.fillCircle(cx + spread + eyeR * 0.22, cy - eyeR * 0.18, eyeR * 0.2);
        // Smile
        g.lineStyle(4, CC.COLORS.INK, 1);
        g.beginPath();
        g.arc(cx, cy + eyeR * 1.6, eyeR * 0.9, 0.15 * Math.PI, 0.85 * Math.PI, false);
        g.strokePath();
    }

    // ── Draw one creature into a graphics object ──────────────
    function drawCreature(g, sp, stage) {
        var base  = sp.color;
        var light = adjust(base, 1.35);
        var dark  = adjust(base, 0.62);
        var cx = TEX / 2;

        if (stage === 'egg') {
            var ey = TEX * 0.55;
            // Egg body (taller than wide)
            g.fillStyle(base, 1);
            g.fillEllipse(cx, ey, TEX * 0.5, TEX * 0.62);
            g.lineStyle(6, CC.COLORS.INK, 1);
            g.strokeEllipse(cx, ey, TEX * 0.5, TEX * 0.62);
            // Belly highlight
            g.fillStyle(light, 0.5);
            g.fillEllipse(cx - TEX * 0.06, ey + TEX * 0.06, TEX * 0.26, TEX * 0.34);
            // Speckles hinting at the species color/pattern
            g.fillStyle(dark, 0.85);
            g.fillCircle(cx - 34, ey + 6, 9);
            g.fillCircle(cx + 26, ey + 28, 7);
            g.fillCircle(cx + 8,  ey - 30, 6);
            // A small motif peeking at the top
            drawMotif(g, sp.family, cx, ey - TEX * 0.30, 0.55, base, light, dark);
            return;
        }

        // Hatchling vs Adult share a body plan; adult is bigger + richer.
        var bodyScale = (stage === 'adult') ? 1.0 : 0.78;
        var by = TEX * 0.58;
        var bw = TEX * 0.56 * bodyScale;
        var bh = TEX * 0.58 * bodyScale;

        // Feet
        g.fillStyle(dark, 1);
        g.fillEllipse(cx - bw * 0.32, by + bh * 0.46, bw * 0.30, bh * 0.16);
        g.fillEllipse(cx + bw * 0.32, by + bh * 0.46, bw * 0.30, bh * 0.16);

        // Motif sits behind/above the body
        drawMotif(g, sp.family, cx, by - bh * 0.52,
                  (stage === 'adult') ? 1.0 : 0.7, base, light, dark);

        // Body
        g.fillStyle(base, 1);
        g.fillEllipse(cx, by, bw, bh);
        g.lineStyle(6, CC.COLORS.INK, 1);
        g.strokeEllipse(cx, by, bw, bh);
        // Belly
        g.fillStyle(light, 0.55);
        g.fillEllipse(cx, by + bh * 0.12, bw * 0.55, bh * 0.6);

        // Face
        var eyeR = (stage === 'adult') ? 18 : 15;
        drawFace(g, cx, by - bh * 0.06, eyeR, bw * 0.24);

        // Adults get a couple of extra flourish dots for "more features"
        if (stage === 'adult') {
            g.fillStyle(dark, 0.8);
            g.fillCircle(cx - bw * 0.34, by + bh * 0.18, 6);
            g.fillCircle(cx + bw * 0.34, by + bh * 0.18, 6);
        }
    }

    // ── Build all placeholder textures (every op × family × stage) ──
    CC.buildPlaceholderTextures = function(scene) {
        CC.OP_KEYS.forEach(function(op) {
            CC.speciesList(op).forEach(function(sp) {
                CC.STAGES.forEach(function(stage) {
                    var key = 'ph_' + CC.texKey(op, sp.family, stage);
                    if (scene.textures.exists(key)) return;
                    var g = scene.make.graphics({ x: 0, y: 0, add: false });
                    drawCreature(g, sp, stage);
                    g.generateTexture(key, TEX, TEX);
                    g.destroy();
                });
            });
        });
    };

    // ── Create a creature image (real art wins, else placeholder) ──
    CC.makeCreature = function(scene, op, family, stage) {
        var realKey = CC.texKey(op, family, stage);
        var key = scene.textures.exists(realKey)
            ? realKey
            : 'ph_' + realKey;
        return scene.add.image(0, 0, key).setOrigin(0.5);
    };
})();
