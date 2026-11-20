import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Question, TestSection, SavedAnswer } from '../types';
import { QuestionPalette } from './QuestionPalette';
import { paletteCounts } from '../services/questionPalette';
import {
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
  LayoutGrid,
  X
} from 'lucide-react';

interface CbtExamEngineProps {
  testId: string;
  onFinishTest: (attemptId: string) => void;
  onExit: () => void;
}

export const CbtExamEngine: React.FC<CbtExamEngineProps> = ({
  testId,
  onFinishTest,
  onExit
}) => {
  const { user, language, setLanguage, t } = useAuth();

  // Test state
  const [attemptId, setAttemptId] = useState<string>('');
  const [testMeta, setTestMeta] = useState<any>(null);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);

  // Per-question time spent tracking
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or resume attempt
  useEffect(() => {
    async function initTest() {
      try {
        setIsLoading(true);
        const res = await api.tests.startAttempt(testId);
        if (res.success) {
          setAttemptId(res.attempt_id);
          setTestMeta(res.test);
          setSections(res.sections || []);
          if (res.sections && res.sections.length > 0) {
            setActiveSectionId(res.sections[0].id);
          }
          setQuestions(res.questions || []);
          setRemainingSeconds(res.remaining_seconds || res.test.duration_minutes * 60);

          // Populate previously saved answers
          const ansMap: Record<string, SavedAnswer> = {};
          if (Array.isArray(res.saved_answers)) {
            res.saved_answers.forEach((ans: any) => {
              ansMap[ans.question_id] = ans;
            });
          }
          setAnswers(ansMap);
        } else {
          setError(res.message || 'Unable to start examination.');
        }
      } catch (err: any) {
        setError(err.message || 'Error initializing examination session.');
      } finally {
        setIsLoading(false);
      }
    }

    initTest();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0 || isLoading) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds, isLoading]);

  // Auto-submit when time expires
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    await executeSubmission();
  };

  const currentQuestion = questions[currentQIndex] || null;

  // Filter questions for active section (if sections configured)
  const activeQuestions = sections.length > 0
    ? questions.filter(q => !q.section_id || q.section_id === activeSectionId)
    : questions;

  // Question navigation and answer persistence
  const saveCurrentQuestionState = async (
    targetOption?: string,
    targetStatus?: SavedAnswer['status']
  ) => {
    if (!currentQuestion || !attemptId) return;

    const timeSpentDelta = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    const existing = answers[currentQuestion.id];
    const totalTime = (existing?.time_spent_seconds || 0) + timeSpentDelta;

    const chosenOption = targetOption !== undefined ? targetOption : (existing?.selected_option || undefined);
    let chosenStatus: SavedAnswer['status'] = targetStatus || existing?.status || 'not_answered';

    if (chosenOption && chosenStatus === 'not_answered') {
      chosenStatus = 'answered';
    }

    const updatedAnswer: SavedAnswer = {
      question_id: currentQuestion.id,
      selected_option: chosenOption,
      status: chosenStatus,
      time_spent_seconds: totalTime
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: updatedAnswer
    }));

    // Reset timer for next question
    questionStartTimeRef.current = Date.now();

    // Persist asynchronously to server
    try {
      await api.tests.saveAnswer(attemptId, updatedAnswer);
    } catch (err) {
      console.warn('Autosave sync notice:', err);
    }
  };

  const handleSelectOption = (optionKey: string) => {
    const existing = answers[currentQuestion?.id || ''];
    let status: SavedAnswer['status'] = 'answered';
    if (existing?.status === 'marked_for_review' || existing?.status === 'answered_and_marked') {
      status = 'answered_and_marked';
    }

    saveCurrentQuestionState(optionKey, status);
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    saveCurrentQuestionState('', 'not_answered');
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    const existing = answers[currentQuestion.id];
    const status: SavedAnswer['status'] = existing?.selected_option ? 'answered_and_marked' : 'marked_for_review';
    saveCurrentQuestionState(existing?.selected_option, status);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const existing = answers[currentQuestion.id];
    const status: SavedAnswer['status'] = existing?.selected_option ? 'answered' : 'not_answered';
    saveCurrentQuestionState(existing?.selected_option, status);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!currentQuestion) return;
    saveCurrentQuestionState();
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const handleJumpToQuestion = (targetIndex: number) => {
    saveCurrentQuestionState();
    setCurrentQIndex(targetIndex);
    const sectionId = questions[targetIndex]?.section_id;
    if (sectionId) setActiveSectionId(sectionId);
    setIsPaletteOpen(false);
  };

  const executeSubmission = async () => {
    try {
      setIsSubmitting(true);
      await saveCurrentQuestionState();
      const res = await api.tests.submitAttempt(attemptId);
      if (res.success) {
        onFinishTest(attemptId);
      } else {
        alert(res.message || 'Submission failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || 'Submission error. Please verify connection and retry.');
      setIsSubmitting(false);
    }
  };

  // Palette status calculation (shared with the grid so the two can never disagree)
  const counts = paletteCounts(questions, answers, currentQIndex);
  const paletteStats = {
    answered: counts.answered,
    not_answered: counts.not_answered,
    not_visited: counts.not_visited,
    marked_for_review: counts.marked,
    answered_and_marked: counts.answered_marked
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Synchronizing Server CBT Examination Session...</h2>
        <p className="text-xs text-slate-400 mt-1">Validating deadlines, question encryption and candidate workspace.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Examination Access Notice</h2>
          <p className="text-sm text-slate-300 mb-6">{error}</p>
          <button
            onClick={onExit}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
          >
            Return to Examination Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 bg-cbt-grid flex flex-col select-none">
      {/* Top Examination Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
            CP
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight truncate max-w-[280px] sm:max-w-md">
              {testMeta?.title || 'Online CBT Examination'}
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              CYBEROSH PARIKSHA – Computer Based Test System (Server Protected)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* Bilingual Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">View Language:</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="font-bold text-amber-400 hover:text-amber-300 underline text-xs"
            >
              {language === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
              remainingSeconds < 300
                ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Student Profile snippet */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700">
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Candidate'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-full border border-amber-400/40 object-cover"
            />
            <div className="text-left text-xs leading-tight">
              <span className="font-semibold block text-white truncate max-w-[120px]">
                {user?.full_name || 'Candidate'}
              </span>
              <span className="text-[10px] text-slate-400">Roll No: CP-2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sections Tab Bar (if configured) */}
      {sections.length > 0 && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider pl-1 pr-2">
            Sections:
          </span>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSectionId(sec.id);
                // Find first question of this section
                const targetIdx = questions.findIndex(q => q.section_id === sec.id);
                if (targetIdx !== -1) setCurrentQIndex(targetIdx);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                activeSectionId === sec.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Examination Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Pane (70% width on desktop) */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200 overflow-y-auto">
          {/* Question Subheader */}
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-800">
                Question {currentQIndex + 1}
              </span>
              <span className="text-xs text-slate-500">of {questions.length}</span>
              {currentQuestion?.subject_name && (
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {currentQuestion.subject_name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                +{currentQuestion?.marks || 1.0} Marks
              </span>
              {currentQuestion?.negative_marks > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  -{currentQuestion?.negative_marks} Negative
                </span>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentQuestion ? (
              <div className="space-y-6 max-w-4xl">
                {/* Question Prompt */}
                <div className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed">
                  {language === 'hi' && currentQuestion.question_hi ? (
                    <div>
                      <p className="mb-2">{currentQuestion.question_hi}</p>
                      <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">
                        English: {currentQuestion.question_en}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2">{currentQuestion.question_en}</p>
                      {currentQuestion.question_hi && (
                        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">
                          हिंदी: {currentQuestion.question_hi}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Image */}
                {currentQuestion.image_url && (
                  <div className="my-4 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                    <img
                      src={currentQuestion.image_url}
                      alt="Question diagram"
                      className="max-h-64 object-contain rounded"
                    />
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t('Select One Option:', 'एक विकल्प चुनें:')}
                  </p>

                  {currentQuestion.options && currentQuestion.options.map(opt => {
                    const isSelected = answers[currentQuestion.id]?.selected_option === opt.option_key;

                    return (
                      <button
                        key={opt.id || opt.option_key}
                        onClick={() => handleSelectOption(opt.option_key)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 shadow-sm text-blue-950 font-semibold'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {opt.option_key}
                        </span>
                        <div className="flex-1 text-sm sm:text-base leading-snug pt-0.5">
                          {language === 'hi' && opt.option_hi ? opt.option_hi : opt.option_en}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No question selected.</p>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearResponse}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('Clear Response', 'उत्तर हटाएं')}
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                className="px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                {t('Mark for Review & Next', 'समीक्षा हेतु चिह्नित करें')}
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handlePrevious}
                disabled={currentQIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('Previous', 'पिछला')}
              </button>

              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-500/20"
              >
                <span>{t('Save & Next', 'सहेजें और अगला')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Question Navigation Palette (desktop sidebar) */}
        <aside className="hidden lg:flex w-80 shrink-0 border-l border-slate-800 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]">
          <div className="w-full">
            <QuestionPalette
              questions={questions}
              sections={sections}
              answers={answers}
              currentIndex={currentQIndex}
              counts={counts}
              onJump={handleJumpToQuestion}
              onSubmit={() => setShowSubmitModal(true)}
              t={t}
            />
          </div>
        </aside>
      </div>

      {/* Phones and tablets: floating button that opens the palette as a drawer */}
      <button
        onClick={() => setIsPaletteOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white border border-slate-700 shadow-xl text-sm font-bold"
        aria-label={t('Open question palette', 'प्रश्नावली खोलें')}
      >
        <LayoutGrid className="w-4 h-4 text-amber-400" />
        <span>
          {counts.answered + counts.answered_marked}/{questions.length}
        </span>
      </button>

      {isPaletteOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-slate-950/70">
          <div className="w-80 max-w-[90vw] h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between bg-slate-950 text-white px-4 py-2.5 border-b border-slate-800">
              <span className="text-sm font-bold">{t('Question Palette', 'प्रश्नावली')}</span>
              <button
                onClick={() => setIsPaletteOpen(false)}
                aria-label={t('Close', 'बंद करें')}
                className="p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <QuestionPalette
                questions={questions}
                sections={sections}
                answers={answers}
                currentIndex={currentQIndex}
                counts={counts}
                onJump={handleJumpToQuestion}
                onSubmit={() => {
                  setIsPaletteOpen(false);
                  setShowSubmitModal(true);
                }}
                t={t}
              />
            </div>
          </div>
          <button className="flex-1" aria-label="Close palette" onClick={() => setIsPaletteOpen(false)} />
        </div>
      )}

      {/* Confirmation Modal Before Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              {t('Confirm Examination Submission', 'परीक्षा सबमिशन की पुष्टि करें')}
            </h3>

            <p className="text-xs text-slate-400 mb-5">
              {t(
                'Please verify your response summary below. Once submitted, you cannot change your answers.',
                'कृपया नीचे अपना सारांश जांचें। एक बार सबमिट करने के बाद आप उत्तर नहीं बदल सकते।'
              )}
            </p>

            {/* Summary Grid */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 grid grid-cols-2 gap-2 text-xs mb-6 text-left">
              <div className="p-2 rounded bg-slate-800">
                <span className="text-slate-400 text-[11px] block">Total Questions</span>
                <span className="font-bold text-white text-base">{questions.length}</span>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 text-[11px] block">Answered</span>
                <span className="font-bold text-emerald-400 text-base">
                  {paletteStats.answered + paletteStats.answered_and_marked}
                </span>
              </div>
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
                <span className="text-rose-400 text-[11px] block">Not Answered</span>
                <span className="font-bold text-rose-400 text-base">{paletteStats.not_answered}</span>
              </div>
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-400 text-[11px] block">Marked for Review</span>
                <span className="font-bold text-purple-400 text-base">
                  {paletteStats.marked_for_review + paletteStats.answered_and_marked}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors"
              >
                {t('Resume Test', 'परीक्षा जारी रखें')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeSubmission}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? t('Submitting...', 'सबमिट हो रहा है...') : t('Yes, Submit Now', 'हाँ, सबमिट करें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
