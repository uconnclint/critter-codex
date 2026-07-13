// ============================================================
// MasteryEngine — the pedagogy engine under the costume.
//
//   • Per-operation, per-family mastery state.
//   • XP → evolution stage; never-punishing awards with speed +
//     difficulty bonuses.
//   • "Sleepy" detection (spaced-repetition surfacing).
//   • Fact selection weighted toward sleepy / low-mastery, scaled
//     by difficulty band, with a chance to re-surface MISSED facts.
//   • "Adaptive" difficulty resolves per critter (Egg→easy …
//     Adult→hard) so questions grow with mastery.
//
// The SAME family numbers (2–9) appear in every operation, but each
// operation has its own critter set and its own progress.
// ============================================================

window.CritterCodex.MasteryEngine = (function() {
    const CFG = CC.CFG;
    const REVIEW_CHANCE = 0.35;   // chance to re-surface a missed fact
    const MISSED_CAP    = 15;     // max remembered misses per operation

    // state[opKey][family] = { xp, lastPracticedAt (ms | 0), timesSeen }
    var state = {};
    // missed[opKey] = [ { family, v, difficulty } ]  (recently-missed facts)
    var missed = {};

    // ── Setup ─────────────────────────────────────────────────
    function blankFamily() { return { xp: 0, lastPracticedAt: 0, timesSeen: 0 }; }

    function init(saved) {
        state = {};
        missed = {};
        CC.OP_KEYS.forEach(function(op) {
            state[op] = {};
            CC.FAMILIES.forEach(function(family) {
                var s = saved && saved.ops && saved.ops[op] && saved.ops[op][family];
                state[op][family] = s ? {
                    xp:              s.xp | 0,
                    lastPracticedAt: s.lastPracticedAt || 0,
                    timesSeen:       s.timesSeen | 0
                } : blankFamily();
            });
            var m = saved && saved.missed && saved.missed[op];
            missed[op] = Array.isArray(m) ? m.slice(0, MISSED_CAP) : [];
        });
        if (saved && saved.session) {
            if (CC.OP_KEYS.indexOf(saved.session.op) !== -1) CC.session.op = saved.session.op;
            if (CC.diffByKey(saved.session.difficulty).key === saved.session.difficulty) {
                CC.session.difficulty = saved.session.difficulty;
            }
        }
    }

    function getState(op, family) { return state[op][family]; }
    function allState()           { return state; }

    // ── Stage from XP ─────────────────────────────────────────
    function stageFor(xp) {
        if (xp >= CFG.ADULT_XP)     return 'adult';
        if (xp >= CFG.HATCHLING_XP) return 'hatchling';
        return 'egg';
    }
    function stageOf(op, family) { return stageFor(state[op][family].xp); }
    function masteryPercent(op, family) {
        return CC.util.clamp(state[op][family].xp / CFG.ADULT_XP, 0, 1);
    }

    // ── Missed-fact memory (lightweight per-fact targeting) ───
    function missKey(family, v) { return family + ':' + v; }
    function recordMiss(op, family, v, difficulty) {
        var q = missed[op];
        for (var i = q.length - 1; i >= 0; i--) {
            if (missKey(q[i].family, q[i].v) === missKey(family, v)) q.splice(i, 1);
        }
        q.push({ family: family, v: v, difficulty: difficulty });
        while (q.length > MISSED_CAP) q.shift();
    }
    function clearMiss(op, family, v) {
        var q = missed[op];
        for (var i = q.length - 1; i >= 0; i--) {
            if (missKey(q[i].family, q[i].v) === missKey(family, v)) q.splice(i, 1);
        }
    }
    function missedCount(op) { return missed[op].length; }

    // ── Award XP for an answer ────────────────────────────────
    // `fact` is the object returned by pickFact / CC.buildFact
    // (has op, family, v, difficulty).
    function award(fact, correct, elapsedMs, now) {
        var s = state[fact.op][fact.family];
        var oldStage = stageFor(s.xp);
        var gained = 0, fast = false;

        if (correct) {
            gained = CFG.XP_CORRECT + CC.diffByKey(fact.difficulty).xpBonus;
            if (elapsedMs < CFG.FAST_MS) { gained += CFG.XP_FAST_BONUS; fast = true; }
            s.xp += gained;
            clearMiss(fact.op, fact.family, fact.v);
        } else {
            recordMiss(fact.op, fact.family, fact.v, fact.difficulty);
        }
        s.lastPracticedAt = now;
        s.timesSeen += 1;

        var newStage = stageFor(s.xp);
        return {
            gained: gained, fast: fast, newXp: s.xp,
            oldStage: oldStage, newStage: newStage,
            evolved: newStage !== oldStage
        };
    }

    // ── Sleepy detection ──────────────────────────────────────
    function isSleepy(op, family, now) {
        var s = state[op][family];
        if (!s.lastPracticedAt) return false;
        return (now - s.lastPracticedAt) > CFG.DECAY_MS;
    }

    // ── Fact selection ────────────────────────────────────────
    function familyWeight(op, family, now) {
        var w = CFG.WEIGHT_BASE;
        if (isSleepy(op, family, now)) w += CFG.WEIGHT_SLEEPY;
        w += CFG.WEIGHT_LOW_MASTERY * (1 - masteryPercent(op, family));
        return w;
    }
    function pickFamily(op, now) {
        var total = 0;
        var weights = CC.FAMILIES.map(function(family) {
            var w = familyWeight(op, family, now); total += w; return w;
        });
        var roll = Math.random() * total;
        for (var i = 0; i < CC.FAMILIES.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return CC.FAMILIES[i];
        }
        return CC.FAMILIES[CC.FAMILIES.length - 1];
    }

    // Resolve 'adaptive' → a concrete band key based on the critter stage.
    function resolveDifficulty(op, family, difficultyKey) {
        if (difficultyKey !== 'adaptive') return difficultyKey;
        var stage = stageOf(op, family);
        return stage === 'adult' ? 'hard' : (stage === 'hatchling' ? 'medium' : 'easy');
    }

    function pickFact(op, difficultyKey, now) {
        // Re-surface a missed fact sometimes (targeted review).
        var q = missed[op];
        if (q.length && Math.random() < REVIEW_CHANCE) {
            var m = q[CC.util.randInt(0, q.length - 1)];
            var rf = CC.buildFact(op, m.family, m.v);
            rf.difficulty = m.difficulty || resolveDifficulty(op, m.family, difficultyKey);
            rf.review = true;
            return rf;
        }
        var family = pickFamily(op, now);
        var effKey = resolveDifficulty(op, family, difficultyKey);
        var band = CC.diffByKey(effKey).band;
        var v = CC.util.randInt(band[0], band[1]);
        var f = CC.buildFact(op, family, v);
        f.difficulty = effKey;
        return f;
    }

    // ── Progress summary helpers (for the dashboard / hooks) ──
    function opMastery(op) {
        var sum = 0;
        CC.FAMILIES.forEach(function(f) { sum += masteryPercent(op, f); });
        return sum / CC.FAMILIES.length;
    }
    function stageCounts(op) {
        var c = { egg: 0, hatchling: 0, adult: 0 };
        CC.FAMILIES.forEach(function(f) { c[stageOf(op, f)]++; });
        return c;
    }
    function totalAdults() {
        var n = 0;
        CC.OP_KEYS.forEach(function(op) {
            CC.FAMILIES.forEach(function(f) { if (stageOf(op, f) === 'adult') n++; });
        });
        return n;
    }
    function totalSleepy(now) {
        var n = 0;
        CC.OP_KEYS.forEach(function(op) {
            CC.FAMILIES.forEach(function(f) { if (isSleepy(op, f, now)) n++; });
        });
        return n;
    }

    // ── Teacher tools ─────────────────────────────────────────
    function simulateDay(now) {
        CC.OP_KEYS.forEach(function(op) {
            CC.FAMILIES.forEach(function(family) {
                var s = state[op][family];
                if (s.lastPracticedAt) s.lastPracticedAt = now - (CFG.DECAY_MS + 1000);
            });
        });
    }
    function reset() { init(null); CC.SaveManager.clear(); }

    // ── Persistence ───────────────────────────────────────────
    function save() {
        CC.SaveManager.save({ ops: state, session: CC.session, missed: missed });
    }

    return {
        init: init, getState: getState, allState: allState,
        stageFor: stageFor, stageOf: stageOf, masteryPercent: masteryPercent,
        award: award, isSleepy: isSleepy, pickFact: pickFact,
        missedCount: missedCount,
        opMastery: opMastery, stageCounts: stageCounts,
        totalAdults: totalAdults, totalSleepy: totalSleepy,
        simulateDay: simulateDay, reset: reset, save: save
    };
})();
