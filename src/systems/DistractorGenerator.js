// ============================================================
// DistractorGenerator — believable wrong answers for the 2×2 grid.
//
// Distractors mirror real kid mistakes, and differ by operation:
//   • ×  : off-by-one-group errors (answer ± a factor) and
//          neighbouring-table products — NOT just ±1, so big
//          products don't become "pick the right consecutive number".
//   • ÷  : quotient slips (±1, ±2) — the natural division error.
//   • + −: off-by-small and place-value (±10) slips.
// All options are unique, non-negative, and never equal the answer.
// ============================================================

window.CritterCodex.DistractorGenerator = (function() {

    function options(answer, n1, n2, op) {
        var chosen = [];

        function tryAdd(v) {
            if (v < 0) return;
            if (v === answer) return;
            if (chosen.indexOf(v) !== -1) return;
            chosen.push(v);
        }

        var candidates;
        if (op === 'mul') {
            // n1, n2 are the factors. Plausible errors come from being one
            // group off, or grabbing a neighbouring multiple — never ±1.
            var a = Math.max(n1, n2), b = Math.min(n1, n2);
            candidates = [
                answer + b, answer - b,        // one group too many / few
                answer + a, answer - a,
                answer + 2 * b, answer - 2 * b,
                (b + 1) * a, (b - 1) * a,       // neighbouring product
                answer + 10, answer - 10
            ];
        } else if (op === 'div') {
            // Quotient errors are usually small.
            candidates = [
                answer + 1, answer - 1,
                answer + 2, answer - 2,
                answer + 3, answer - 3,
                answer + 5, answer - 5,
                n2,                             // "answered the divisor"
                answer + 10
            ];
        } else {
            // Addition / subtraction: small slips + place-value miss.
            candidates = [
                answer + 1, answer - 1,
                answer + 2, answer - 2,
                answer + 10, answer - 10,
                answer + 3, answer - 3,
                answer + 9, answer - 9          // carry/borrow slip
            ];
        }

        CC.util.shuffle(candidates);
        for (var i = 0; i < candidates.length && chosen.length < 3; i++) {
            tryAdd(candidates[i]);
        }

        // Safety net so we always reach three distinct distractors.
        var pad = 4;
        while (chosen.length < 3) {
            tryAdd(answer + pad);
            tryAdd(Math.max(0, answer - pad));
            pad++;
        }

        var all = chosen.slice(0, 3);
        all.push(answer);
        return CC.util.shuffle(all);
    }

    return { options: options };
})();
