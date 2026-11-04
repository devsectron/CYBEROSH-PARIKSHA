import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Question } from '../types';
import { Flame, CheckCircle2, XCircle, RotateCcw, Award, Sparkles, Globe, HelpCircle } from 'lucide-react';

interface DailyQuizPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const DailyQuizPage: React.FC<DailyQuizPageProps> = ({ onNavigate }) => {
  const { user, language, setLanguage, t } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true);
        const res = await api.content.getDailyQuiz();
        if (res.success && res.quiz) {
          setQuiz(res.quiz);
        }
      } catch (err) {
        console.warn('Error loading daily quiz:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, []);

  const handleSelect = (qId: string, optKey: string) => {
    if (isSubmitted) return;
    setUserPicks(prev => ({ ...prev, [qId]: optKey }));
  };

  const calculateScore = () => {
    if (!quiz || !quiz.questions) return { correct: 0, total: 0 };
    let correct = 0;
    quiz.questions.forEach((q: any) => {
      if (userPicks[q.id] === q.correct_answer) {
        correct++;
      }
    });
    return { correct, total: quiz.questions.length };
  };

  const scoreInfo = calculateScore();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold mb-2">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{user?.streak_days || 7} {t('Day Preparation Streak', 'दिन तैयारी स्ट्रीक')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('Daily Revision Quiz', 'दैनिक रिवीज़न क्विज़')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-900 font-medium max-w-lg mt-1">
              {t('Sharpen your general knowledge, pedagogy, reasoning and aptitude with 5 daily curated questions.', '5 चयनित प्रश्नों के साथ सामान्य ज्ञान, शिक्षण कला और तर्कशक्ति का अभ्यास करें।')}
            </p>
          </div>

          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-3.5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold flex items-center gap-2 shrink-0 hover:bg-slate-900 shadow-md"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'हिंदी में हल करें' : 'Switch to English'}</span>
          </button>
        </div>

        {/* Score Card when submitted */}
        {isSubmitted && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                Quiz Evaluation
              </span>
              <p className="text-2xl font-black text-slate-900">
                You scored {scoreInfo.correct} / {scoreInfo.total} Correct!
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed pedagogical explanations for each question are displayed below.
              </p>
            </div>

            <button
              onClick={() => {
                setUserPicks({});
                setIsSubmitted(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
          </div>
        )}

        {/* Quiz Questions */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading today’s questions...</div>
        ) : !quiz || !quiz.questions ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-xs">
            Quiz currently unavailable.
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((q: any, idx: number) => {
              const selectedOpt = userPicks[q.id];
              const isAnswered = !!selectedOpt;
              const isCorrect = selectedOpt === q.correct_answer;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                      Question {idx + 1} of {quiz.questions.length}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{q.subject_name || 'General Awareness'}</span>
                  </div>

                  <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {language === 'hi' && q.question_hi ? q.question_hi : q.question_en}
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options && q.options.map((opt: any) => {
                      const isPicked = selectedOpt === opt.option_key;
                      let btnStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';

                      if (isSubmitted) {
                        if (opt.option_key === q.correct_answer) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                        } else if (isPicked && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                        }
                      } else if (isPicked) {
                        btnStyle = 'border-blue-600 bg-blue-50 text-blue-950 font-semibold shadow-sm';
                      }

                      return (
                        <button
                          key={opt.id || opt.option_key}
                          onClick={() => handleSelect(q.id, opt.option_key)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {opt.option_key}
                          </span>
                          <span className="pt-0.5 leading-snug">
                            {language === 'hi' && opt.option_hi ? opt.option_hi : opt.option_en}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submit */}
                  {isSubmitted && (q.solution_en || q.solution_hi) && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-blue-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        Explanation:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{q.solution_en}</p>
                      {q.solution_hi && (
                        <p className="text-slate-500 pt-1 border-t border-slate-200">
                          हिंदी: {q.solution_hi}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!isSubmitted && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setIsSubmitted(true)}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl transition-all shadow-emerald-600/25"
                >
                  Submit & View Instant Answers
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
