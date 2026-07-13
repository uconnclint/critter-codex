// ============================================================
// FloatingText — juicy "+10" / "+5 fast!" pop that rises and fades.
// ============================================================

window.CritterCodex.FloatingText = function(scene, x, y, msg, opts) {
    opts = opts || {};
    var color = opts.color || CC.HEX.GOLD;
    var size  = opts.size  || 40;

    var t = scene.add.text(x, y, msg, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: size + 'px',
        fontStyle: '800',
        color: color,
        stroke: CC.HEX.INK,
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(900);

    t.setScale(0.4);
    scene.tweens.add({
        targets: t,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut'
    });
    scene.tweens.add({
        targets: t,
        y: y - 70,
        alpha: 0,
        duration: 900,
        delay: 250,
        ease: 'Cubic.easeIn',
        onComplete: function() { t.destroy(); }
    });
    return t;
};
