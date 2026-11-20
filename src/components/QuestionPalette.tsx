import React from 'react';
import { Send } from 'lucide-react';
import { PaletteCounts, PaletteState, paletteStateOf } from '../services/questionPalette';
import { Question, SavedAnswer, TestSection } from '../types';

interface QuestionPaletteProps {
  questions: Question[];
  sections: TestSection[];
  answers: Record<string, SavedAnswer>;
  currentIndex: number;
  counts: PaletteCounts;
  onJump: (index: number) => void;
  onSubmit: () => void;
  t: (en: string, hi: string) => string;
}

const BUTTON_STYLE: Record<PaletteState, string> = {
  not_visited: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700',
  not_answered: 'bg-rose-600 text-white border-rose-500 font-bold',
  answered: 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm',
  marked: 'bg-purple-600 text-white border-purple-500 font-bold',
  answered_marked: 'bg-purple-600 text-white border-purple-500 font-bold'
};

const STATE_LABEL: Record<PaletteState, string> = {
  not_visited: 'not visited',
  not_answered: 'not answered',
  answered: 'answered',
  marked: 'marked for review',
  answered_marked: 'answered and marked for review'
};

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  sections,
  answers,
  currentIndex,
  counts,
  onJump,
  onSubmit,
  t
}) => {
  const renderButton = (q: Question, idx: number) => {
    const state = paletteStateOf(answers[q.id], idx === currentIndex);
    const isCurrent = idx === currentIndex;
    return (
      <button
        key={q.id}
        onClick={() => onJump(idx)}
        aria-label={`Question ${idx + 1}, ${STATE_LABEL[state]}`}
        aria-current={isCurrent ? 'true' : undefined}
        className={`relative h-9 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center ${BUTTON_STYLE[state]} ${
          isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10' : ''
        }`}
      >
        {idx + 1}
        {state === 'answered_marked' && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
        )}
      </button>
    );
  };

  // Group by section when the test has sections; question numbers stay global (1..N).
  const groups: Array<{ id: string; title: string | null; items: Array<{ q: Question; idx: number }> }> = [];
  if (sections.length > 0) {
    sections.forEach(sec => {
      const items = questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => q.section_id === sec.id);
      if (items.length) groups.push({ id: sec.id, title: sec.name || sec.id, items });
    });
    const loose = questions.map((q, idx) => ({ q, idx })).filter(({ q }) => !q.section_id || !sections.some(s => s.id === q.section_id));
    if (loose.length) groups.push({ id: '_other', title: null, items: loose });
  } else {
    groups.push({ id: '_all', title: null, items: questions.map((q, idx) => ({ q, idx })) });
  }

  const legend: Array<{ key: PaletteState; swatch: string; label: string; dot?: boolean; wide?: boolean }> = [
    { key: 'answered', swatch: 'bg-emerald-600 text-white', label: t('Answered', 'उत्तर दिया') },
    { key: 'not_answered', swatch: 'bg-rose-600 text-white', label: t('Not Answered', 'उत्तर नहीं दिया') },
    { key: 'not_visited', swatch: 'bg-slate-700 text-slate-300', label: t('Not Visited', 'देखा नहीं गया') },
    { key: 'marked', swatch: 'bg-purple-600 text-white', label: t('Review', 'समीक्षा हेतु') },
    {
      key: 'answered_marked',
      swatch: 'bg-purple-600 text-white',
      label: t('Answered & Marked for Review', 'उत्तर दिया व समीक्षा हेतु'),
      dot: true,
      wide: true
    }
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 text-xs">
        <h3 className="font-bold text-slate-300 mb-3 uppercase tracking-wider text-[11px]">
          {t('Question Palette Status', 'प्रश्नावली स्थिति')}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {legend.map(item => (
            <div key={item.key} className={`flex items-center gap-2 ${item.wide ? 'col-span-2' : ''}`}>
              <span className={`relative w-5 h-5 rounded-md font-bold flex items-center justify-center text-[10px] ${item.swatch}`}>
                {counts[item.key]}
                {item.dot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
                )}
              </span>
              <span className="text-slate-300 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {t('Jump to Question:', 'प्रश्न पर जाएं:')}
        </p>
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id}>
              {group.title && (
                <p className="text-[11px] font-bold text-amber-400/90 mb-1.5 truncate">{group.title}</p>
              )}
              <div className="grid grid-cols-5 gap-2">{group.items.map(({ q, idx }) => renderButton(q, idx))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <button
          onClick={onSubmit}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{t('Submit Examination', 'परीक्षा सबमिट करें')}</span>
        </button>
      </div>
    </div>
  );
};
