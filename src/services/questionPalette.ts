// Pure helpers for the CBT question palette. Kept free of React so they can be unit-tested in Node
// (tests/palette.test.ts). The grid buttons and the legend counters both read from here, so they can
// never disagree about a question's status.

export type PaletteState =
  | 'not_visited'      // never opened
  | 'not_answered'     // opened, nothing chosen
  | 'answered'         // an option is chosen
  | 'marked'           // marked for review, nothing chosen
  | 'answered_marked'; // marked for review, with an option chosen

export interface PaletteAnswerLike {
  status?: string;
  selected_option?: string | null;
}

/**
 * The question that is on screen counts as visited even before anything is saved for it, so the grid shows
 * the same colour the legend counts.
 */
export function paletteStateOf(answer: PaletteAnswerLike | undefined | null, isCurrent: boolean): PaletteState {
  const hasOption = Boolean(answer?.selected_option);
  switch (answer?.status) {
    case 'answered_and_marked':
      return 'answered_marked';
    case 'marked_for_review':
      return hasOption ? 'answered_marked' : 'marked';
    case 'answered':
      return hasOption ? 'answered' : 'not_answered';
    case 'not_answered':
      return hasOption ? 'answered' : 'not_answered';
    default:
      // missing or 'not_visited'
      if (hasOption) return 'answered';
      return isCurrent ? 'not_answered' : 'not_visited';
  }
}

export type PaletteCounts = Record<PaletteState, number>;

export function paletteCounts(
  questions: Array<{ id: string }>,
  answers: Record<string, PaletteAnswerLike>,
  currentIndex: number
): PaletteCounts {
  const counts: PaletteCounts = { not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0 };
  questions.forEach((q, idx) => {
    counts[paletteStateOf(answers[q.id], idx === currentIndex)]++;
  });
  return counts;
}
