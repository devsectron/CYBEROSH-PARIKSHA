import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TestAttempt, SubjectBreakdown, Question } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  BarChart2,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface TestResultViewProps {
  attemptId: string;
  onBackToDashboard: () => void;
  onReattempt: (testId: string) => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  attemptId,
  onBackToDashboard,
  onReattempt
}) => {
  const { language, t } = useAuth();
  const [attempt, setAttempt] = useState<any>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectBreakdown[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        setIsLoading(true);
        const res = await api.tests.getAttemptResult(attemptId);
        if (res.success) {
          setAttempt(res.attempt);
          setSubjectBreakdown(res.subject_breakdown || []);
          setQuestions(res.questions || []);

          // Trigger celebratory confetti if score is above 60%
          if (res.attempt.total_score / (res.attempt.max_marks || 1) >= 0.6) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        } else {
          setError(res.message || 'Failed to load test report.');
        }
      } catch (err: any) {
        setError(err.message || 'Error retrieving evaluation report.');
      } finally {
        setIsLoading(false);
      }
    }

    loadResult();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-300">Evaluating Examination & Computing Percentiles...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Result</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'Attempt result unavailable.'}</p>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            Go to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const percentage = attempt.max_marks > 0
    ? ((attempt.total_score / attempt.max_marks) * 100).toFixed(1)
    : '0';

  const filteredQuestions = questions.filter(q => {
    if (filterType === 'correct') return q.is_correct === 1;
    if (filterType === 'incorrect') return q.is_correct === 0 && q.selected_option;
    if (filterType === 'unattempted') return !q.selected_option;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Back to Student Dashboard', 'छात्र डैशबोर्ड पर वापस जाएं')}</span>
          </button>

          <button
            onClick={() => onReattempt(attempt.test_id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('Re-attempt Test', 'पुनः परीक्षा दें')}</span>
          </button>
        </div>

        {/* Hero Scorecard Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  {attempt.exam_name || 'Competitive Examination'}
                </span>
                <span className="text-xs text-slate-400">
                  Attempted on {new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {attempt.test_title || 'Mock Test Comprehensive Evaluation'}
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                {t(
                  'Authentic score calculated using examination negative marking rules and benchmarked against peer candidates.',
                  'परीक्षा की निगेटिव मार्किंग और साथी अभ्यर्थियों के प्राप्तांकों के आधार पर तैयार किया गया प्रामाणिक परिणाम।'
                )}
              </p>
            </div>

            {/* Score Pill */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-center shrink-0 min-w-[200px] shadow-lg">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                {t('Your Total Score', 'आपका कुल प्राप्तांक')}
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-white">{attempt.total_score}</span>
                <span className="text-sm font-semibold text-slate-400">/ {attempt.max_marks}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-emerald-400">
                {percentage}% Score ({attempt.accuracy}% Accuracy)
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800/80 text-center">
            <div className="p-3 rounded-xl bg-slate-800/50">
              <span className="text-[11px] text-slate-400 block mb-1">{t('All-India / State Rank', 'रैंक')}</span>
              <span className="text-lg font-bold text-white">#{attempt.rank || 1}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50">
              <span className="text-[11px] text-slate-400 block mb-1">{t('Percentile', 'पर्सेंटाइल')}</span>
              <span className="text-lg font-bold text-amber-400">{attempt.percentile}%ile</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50">
              <span className="text-[11px] text-slate-400 block mb-1">{t('Time Taken', 'समय लगा')}</span>
              <span className="text-lg font-bold text-white">
                {Math.floor((attempt.time_taken_seconds || 0) / 60)}m {((attempt.time_taken_seconds || 0) % 60)}s
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50">
              <span className="text-[11px] text-slate-400 block mb-1">{t('Total Attempted', 'कुल हल किए')}</span>
              <span className="text-lg font-bold text-blue-400">
                {attempt.correct_count + attempt.incorrect_count} / {attempt.correct_count + attempt.incorrect_count + attempt.unattempted_count}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold">{t('Correct Answers', 'सही उत्तर')}</span>
              <p className="text-2xl font-bold text-slate-900">{attempt.correct_count}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold">{t('Incorrect Answers', 'गलत उत्तर')}</span>
              <p className="text-2xl font-bold text-slate-900">{attempt.incorrect_count}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold">{t('Unattempted Questions', 'छोड़े गए प्रश्न')}</span>
              <p className="text-2xl font-bold text-slate-900">{attempt.unattempted_count}</p>
            </div>
          </div>
        </div>

        {/* Subject-Wise Performance Table */}
        {subjectBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {t('Subject & Sectional Performance', 'विषय-वार प्रदर्शन विश्लेषण')}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center text-emerald-600">Correct</th>
                    <th className="py-3 px-4 text-center text-rose-600">Incorrect</th>
                    <th className="py-3 px-4 text-center">Unattempted</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Net Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {subjectBreakdown.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject}</td>
                      <td className="py-3 px-4 text-center">{sub.total_questions}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">{sub.correct}</td>
                      <td className="py-3 px-4 text-center text-rose-600 font-bold">{sub.incorrect}</td>
                      <td className="py-3 px-4 text-center text-slate-400">{sub.unattempted}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          sub.accuracy >= 75 ? 'bg-emerald-50 text-emerald-700' :
                          sub.accuracy >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {sub.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{sub.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Question-By-Question Detailed Solution Review */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>{t('Question-by-Question Solution & Explanations', 'विस्तृत उत्तर और समाधान समीक्षा')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('Inspect official answer keys and step-by-step solutions in English and Hindi', 'आधिकारिक उत्तर कुंजी और विस्तृत हिंदी/अंग्रेजी समाधान देखें')}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilterType('correct')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'correct' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Correct ({attempt.correct_count})
              </button>
              <button
                onClick={() => setFilterType('incorrect')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'incorrect' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Incorrect ({attempt.incorrect_count})
              </button>
              <button
                onClick={() => setFilterType('unattempted')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'unattempted' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unattempted ({attempt.unattempted_count})
              </button>
            </div>
          </div>

          {/* Questions Accordion List */}
          <div className="space-y-4">
            {filteredQuestions.map(q => {
              const isExpanded = expandedQId === q.id || questions.length <= 5;
              const isCorrect = q.is_correct === 1;
              const isAttempted = !!q.selected_option;

              return (
                <div
                  key={q.id}
                  className={`border rounded-2xl transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isAttempted
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  {/* Header Row */}
                  <div
                    onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isAttempted
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        Q{q.question_order}
                      </span>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-xl">
                          {language === 'hi' && q.question_hi ? q.question_hi : q.question_en}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>{q.subject_name || 'General'}</span>
                          <span>•</span>
                          <span>Your Ans: {q.selected_option || 'None'}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">Correct: {q.correct_answer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAttempted
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCorrect ? `+${q.marks}` : isAttempted ? `-${q.negative_marks}` : '0 Marks'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-200/60 mt-2 space-y-4 text-xs">
                      {/* Full Question Text */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed">
                        <p className="font-medium mb-2">{q.question_en}</p>
                        {q.question_hi && (
                          <p className="text-slate-600 border-t border-slate-100 pt-2 font-normal">
                            हिंदी: {q.question_hi}
                          </p>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options && q.options.map((opt: any) => {
                          const isOptionCorrect = opt.option_key === q.correct_answer;
                          const isUserPick = opt.option_key === q.selected_option;

                          let badgeClass = 'border-slate-200 bg-white text-slate-700';
                          if (isOptionCorrect) {
                            badgeClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                          } else if (isUserPick && !isOptionCorrect) {
                            badgeClass = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                          }

                          return (
                            <div
                              key={opt.id || opt.option_key}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 ${badgeClass}`}
                            >
                              <span className="w-5 h-5 rounded-md bg-slate-200/80 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {opt.option_key}
                              </span>
                              <div className="flex-1 text-xs">
                                <p>{language === 'hi' && opt.option_hi ? opt.option_hi : opt.option_en}</p>
                                {isOptionCorrect && (
                                  <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                                    ✓ Correct Answer
                                  </span>
                                )}
                                {isUserPick && !isOptionCorrect && (
                                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                                    ✗ Your Selection
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Step-by-Step Explanation */}
                      {(q.solution_en || q.solution_hi) && (
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                          <span className="font-bold text-[11px] uppercase tracking-wider block text-blue-800 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Detailed Pedagogical Solution:
                          </span>
                          <p className="leading-relaxed mb-1">{q.solution_en}</p>
                          {q.solution_hi && (
                            <p className="text-slate-600 text-[11px] border-t border-blue-100 pt-1 mt-1">
                              हिंदी व्याख्या: {q.solution_hi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
