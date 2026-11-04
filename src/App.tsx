import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CbtExamEngine } from './components/CbtExamEngine';
import { TestResultView } from './components/TestResultView';

// Pages
import { HomePage } from './pages/HomePage';
import { AllExamsPage } from './pages/AllExamsPage';
import { ExamDetailPage } from './pages/ExamDetailPage';
import { MockTestsCatalogPage } from './pages/MockTestsCatalogPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { ModelPapersPage } from './pages/ModelPapersPage';
import { DailyQuizPage } from './pages/DailyQuizPage';
import { CurrentAffairsPage } from './pages/CurrentAffairsPage';
import { PricingPage } from './pages/PricingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaticPages } from './pages/StaticPages';
import { Search, X, GraduationCap, ChevronRight } from 'lucide-react';
import { api } from './services/api';

function MainApp() {
  const { user, t } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allExams, setAllExams] = useState<any[]>([]);

  useEffect(() => {
    // Preload examinations list for search modal
    api.exams.getExams().then(res => {
      if (res.success) setAllExams(res.exams || []);
    }).catch(() => {});
  }, []);

  const handleNavigate = (view: string, param: string = '') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    setViewParam(param);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // CBT Mode check
  const isCbtActive = currentView === 'attempt-test';

  const searchResults = searchQuery.trim()
    ? allExams.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-omr-pattern-subtle font-sans text-slate-900">
      {/* Navbar rendered on all views except active full-screen CBT engine */}
      {!isCbtActive && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'exams' && (
          <AllExamsPage initialSearch={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'exam-detail' && (
          <ExamDetailPage slug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'mock-tests' && (
          <MockTestsCatalogPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'materials' && (
          <StudyMaterialsPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'papers' && (
          <ModelPapersPage onNavigate={handleNavigate} />
        )}

        {currentView === 'daily-quiz' && (
          <DailyQuizPage onNavigate={handleNavigate} />
        )}

        {currentView === 'current-affairs' && (
          <CurrentAffairsPage onNavigate={handleNavigate} />
        )}

        {currentView === 'pricing' && (
          <PricingPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboard
            onNavigate={handleNavigate}
            onViewResult={(attemptId) => handleNavigate('test-result', attemptId)}
            onAttemptTest={(testId) => handleNavigate('attempt-test', testId)}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'attempt-test' && (
          <CbtExamEngine
            testId={viewParam}
            onFinishTest={(attemptId) => handleNavigate('test-result', attemptId)}
            onExit={() => handleNavigate('mock-tests')}
          />
        )}

        {currentView === 'test-result' && (
          <TestResultView
            attemptId={viewParam}
            onBackToDashboard={() => handleNavigate('student-dashboard')}
            onReattempt={(testId) => handleNavigate('attempt-test', testId)}
          />
        )}

        {['about', 'blog', 'contact', 'terms', 'privacy', 'refund', 'disclaimer'].includes(currentView) && (
          <StaticPages page={currentView as any} onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer rendered on normal views */}
      {!isCbtActive && <Footer onNavigate={handleNavigate} />}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          // If navigated to a private page or kept on home
        }}
      />

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search examination e.g. Bihar STET, BPSC, JEE Main..."
                className="flex-1 text-sm text-slate-900 focus:outline-none"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  {searchQuery ? 'No matching examinations found.' : 'Type an exam name to quickly navigate.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        handleNavigate('exam-detail', exam.slug);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left text-xs text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="font-bold text-slate-900 block">{exam.name}</span>
                          <span className="text-[10px] text-slate-500">{exam.full_name}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
