// Unit tests for the CBT question palette status rules (grid colours and legend counts share these).
import { paletteCounts, paletteStateOf } from '../src/services/questionPalette.js';

let passed = 0;
let failed = 0;
function assert(condition: unknown, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log(' QUESTION PALETTE TESTS');
console.log('====================================================\n');

console.log('1. STATUS OF ONE QUESTION');
assert(paletteStateOf(undefined, false) === 'not_visited', 'Never opened -> not visited');
assert(paletteStateOf({ status: 'not_visited' }, false) === 'not_visited', "Explicit 'not_visited' -> not visited");
assert(paletteStateOf(undefined, true) === 'not_answered', 'The question on screen counts as visited (not answered)');
assert(paletteStateOf({ status: 'not_answered' }, false) === 'not_answered', 'Opened, nothing chosen -> not answered');
assert(paletteStateOf({ status: 'answered', selected_option: 'B' }, false) === 'answered', 'Option chosen -> answered');
assert(paletteStateOf({ status: 'marked_for_review' }, false) === 'marked', 'Marked, nothing chosen -> marked');
assert(paletteStateOf({ status: 'marked_for_review', selected_option: 'A' }, false) === 'answered_marked', 'Marked with an option -> answered & marked');
assert(paletteStateOf({ status: 'answered_and_marked', selected_option: 'A' }, false) === 'answered_marked', 'answered_and_marked -> answered & marked');
assert(paletteStateOf({ status: 'answered', selected_option: '' }, false) === 'not_answered', "'answered' with the option cleared -> not answered");
assert(paletteStateOf({ status: 'not_answered', selected_option: 'C' }, false) === 'answered', 'An option always wins over a stale status');

console.log('\n2. COUNTS MATCH THE GRID');
const qs = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }];
const answers = {
  q1: { status: 'answered', selected_option: 'A' },
  q2: { status: 'marked_for_review' },
  q3: { status: 'answered_and_marked', selected_option: 'B' },
  q4: { status: 'not_answered' }
};
const c = paletteCounts(qs, answers, 4);
assert(c.answered === 1, 'One answered');
assert(c.marked === 1, 'One marked for review');
assert(c.answered_marked === 1, 'One answered & marked');
assert(c.not_answered === 2, 'q4 plus the open question q5 are not answered');
assert(c.not_visited === 0, 'Nothing left unvisited');
assert(Object.values(c).reduce((a, b) => a + b, 0) === qs.length, 'Every question is counted exactly once');
const fresh = paletteCounts(qs, {}, 0);
assert(fresh.not_visited === 4 && fresh.not_answered === 1, 'A fresh test: first question open, the rest not visited');

console.log('\n====================================================');
console.log(` PALETTE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');
if (failed > 0) process.exit(1);
