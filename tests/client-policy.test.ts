// Unit tests for the client's rules about WHEN the browser may take over from the server.
// These guard the integrity rule: only "server unreachable" may trigger the offline fallback.
import { ApiError, canPracticeOffline, isOfflineAttempt, isServerUnreachable, OFFLINE_ATTEMPT_PREFIX } from '../src/services/attemptRouting.js';

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
console.log(' CLIENT OFFLINE-FALLBACK POLICY TESTS');
console.log('====================================================\n');

console.log('1. WHEN MAY THE BROWSER TAKE OVER?');
assert(isServerUnreachable(new ApiError('no network', 0)), 'No connection (status 0) -> fallback allowed');
assert(isServerUnreachable(new ApiError('boom', 500)), 'Server error 500 -> fallback allowed');
assert(isServerUnreachable(new ApiError('bad gateway', 502)), 'Gateway error 502 -> fallback allowed');
assert(isServerUnreachable(new ApiError('down', 503)), 'Service unavailable 503 -> fallback allowed');
assert(!isServerUnreachable(new ApiError('premium only', 403)), '403 (premium test, not entitled) -> NEVER falls back');
assert(!isServerUnreachable(new ApiError('sign in', 401)), '401 (not signed in) -> NEVER falls back');
assert(!isServerUnreachable(new ApiError('missing', 404)), '404 -> NEVER falls back');
assert(!isServerUnreachable(new ApiError('invalid', 400)), '400 -> NEVER falls back');
assert(!isServerUnreachable(new ApiError('slow down', 429)), '429 (rate limited) -> NEVER falls back');
assert(!isServerUnreachable(new Error('plain error')), 'An error without a status is not treated as "server down"');
assert(!isServerUnreachable(null) && !isServerUnreachable(undefined), 'null / undefined are not treated as "server down"');

console.log('\n2. WHICH TESTS MAY BE PRACTISED OFFLINE?');
assert(canPracticeOffline({ is_free: 1 }), 'A free test (is_free = 1) is allowed');
assert(canPracticeOffline({ is_free: true }), 'A free test (is_free = true) is allowed');
assert(!canPracticeOffline({ is_free: 0 }), 'A premium test is never allowed offline');
assert(!canPracticeOffline({}), 'A test with no is_free flag is not allowed');
assert(!canPracticeOffline(undefined) && !canPracticeOffline(null), 'An unknown test is not allowed');

console.log('\n3. ATTEMPT ROUTING');
assert(isOfflineAttempt(`${OFFLINE_ATTEMPT_PREFIX}123_abcd`), 'offline_ ids are routed to the device');
assert(!isOfflineAttempt('att_3f9c1a2b4d5e6f708192'), 'Server attempt ids are routed to the server');
assert(!isOfflineAttempt(''), 'An empty id is routed to the server (which rejects it)');

console.log('\n====================================================');
console.log(` CLIENT POLICY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');
process.exit(failed > 0 ? 1 : 0);
