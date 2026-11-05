// Pure scoring helpers for the CBT engine. No database or HTTP access in here so the
// exact code that grades real attempts is also what the test-suite exercises.
import { istDateKey, round2 } from './util.js';

export interface ScoringQuestion {
  question_id: string;
  question_type?: string | null;
  correct_answer: string;
  marks: number;
  negative_marks: number;
}

export interface ScoringAnswer {
  question_id: string;
  selected_option?: string | null;
  numerical_answer?: string | null;
}

export type Verdict = 'correct' | 'incorrect' | 'unattempted';

export interface QuestionOutcome {
  question_id: string;
  verdict: Verdict;
  marks_awarded: number;
}

export interface ScoreSummary {
  /** Score reported to the student (never below zero). */
  total_score: number;
  /** Score before clamping at zero. */
  raw_score: number;
  max_marks: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  accuracy: number;
  outcomes: QuestionOutcome[];
}

function normaliseChoice(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/** "c, a ; B" -> "A,B,C" so multi-select answers compare irrespective of order / separators. */
function normaliseChoiceSet(value: unknown): string {
  const parts = String(value ?? '')
    .toUpperCase()
    .split(/[\s,;|]+/)
    .filter(Boolean);
  return Array.from(new Set(parts)).sort().join(',');
}

function numbersMatch(given: unknown, expected: unknown): boolean {
  const a = Number(String(given).trim());
  const b = Number(String(expected).trim());
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
}

export function evaluateAnswer(question: ScoringQuestion, answer: ScoringAnswer | undefined): Verdict {
  if (!answer) return 'unattempted';
  const type = question.question_type || 'single_mcq';

  if (type === 'numerical') {
    const given = answer.numerical_answer ?? answer.selected_option;
    if (given === null || given === undefined || String(given).trim() === '') return 'unattempted';
    return numbersMatch(given, question.correct_answer) ? 'correct' : 'incorrect';
  }

  if (type === 'multi_mcq') {
    const given = normaliseChoiceSet(answer.selected_option);
    if (!given) return 'unattempted';
    return given === normaliseChoiceSet(question.correct_answer) ? 'correct' : 'incorrect';
  }

  // single_mcq, assertion_reason, match_following all resolve to a single option key.
  const given = normaliseChoice(answer.selected_option);
  if (!given) return 'unattempted';
  return given === normaliseChoice(question.correct_answer) ? 'correct' : 'incorrect';
}

export function computeScore(questions: ScoringQuestion[], answers: ScoringAnswer[]): ScoreSummary {
  const answerByQuestion = new Map<string, ScoringAnswer>();
  for (const a of answers) answerByQuestion.set(a.question_id, a);

  let raw = 0;
  let maxMarks = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  const outcomes: QuestionOutcome[] = [];

  for (const q of questions) {
    maxMarks += q.marks;
    const verdict = evaluateAnswer(q, answerByQuestion.get(q.question_id));

    if (verdict === 'correct') {
      correct++;
      raw += q.marks;
      outcomes.push({ question_id: q.question_id, verdict, marks_awarded: q.marks });
    } else if (verdict === 'incorrect') {
      incorrect++;
      raw -= q.negative_marks;
      outcomes.push({ question_id: q.question_id, verdict, marks_awarded: -q.negative_marks });
    } else {
      unattempted++;
      outcomes.push({ question_id: q.question_id, verdict, marks_awarded: 0 });
    }
  }

  const attempted = correct + incorrect;
  return {
    total_score: round2(Math.max(0, raw)),
    raw_score: round2(raw),
    max_marks: round2(maxMarks),
    correct_count: correct,
    incorrect_count: incorrect,
    unattempted_count: unattempted,
    accuracy: attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0,
    outcomes
  };
}

/** Share of all candidates (peers + this one) who scored strictly lower. */
export function computePercentile(score: number, peerScores: number[]): number {
  const total = peerScores.length + 1;
  const below = peerScores.filter(s => s < score).length;
  return Number(((below / total) * 100).toFixed(1));
}

/** Standard competition ranking: 1 + number of peers who scored strictly higher. */
export function computeRank(score: number, peerScores: number[]): number {
  return 1 + peerScores.filter(s => s > score).length;
}

/**
 * Daily streak: submitting a test on a new IST calendar day extends the streak only if
 * the previous activity was the day before; repeats on the same day do not inflate it;
 * any longer gap restarts it at 1.
 */
export function nextStreak(
  previousStreak: number | null | undefined,
  lastActive: string | null | undefined,
  now: number = Date.now()
): number {
  const current = Math.max(1, Number(previousStreak) || 0);
  if (!lastActive || Number.isNaN(new Date(lastActive).getTime())) return 1;
  const lastKey = istDateKey(lastActive);
  const today = istDateKey(now);
  const yesterday = istDateKey(now - 24 * 60 * 60 * 1000);
  if (lastKey === today) return current;
  if (lastKey === yesterday) return current + 1;
  return 1;
}
