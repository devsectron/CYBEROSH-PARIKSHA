import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Examination, Subject, MockTest, StudyMaterial, ModelPaper } from '../types';
import {
  GraduationCap,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
  Download,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface ExamDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ExamDetailPage: React.FC<ExamDetailPageProps> = ({ slug, onNavigate }) => {
  const { t } = useAuth();
  const [exam, setExam] = useState<Examination | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [papers, setPapers] = useState<ModelPaper[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'tests' | 'materials' | 'papers'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExam() {
      try {
        setIsLoading(true);
        const res = await api.exams.getExamBySlug(slug);
        if (res.success && res.exam) {
          setExam(res.exam);
          setSubjects(res.subjects || []);
          setMockTests(res.mockTests || []);
          setMaterials(res.materials || []);
          setPapers(res.papers || []);
        } else {
          setError(res.message || 'Examination not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve examination details.');
      } finally {
        setIsLoading(false);
      }
    }

    loadExam();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">Loading examination portal...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Examination Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'The requested examination could not be located.'}</p>
          <button
            onClick={() => onNavigate('exams')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            Browse All Examinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Back Button */}
        <button
          onClick={() => onNavigate('exams')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('All Examinations', 'सभी परीक्षाएं')}</span>
        </button>

        {/* Hero Examination Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  {exam.category_name}
                </span>
                {exam.official_website && (
                  <a
                    href={exam.official_website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-400"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {exam.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {exam.full_name}
              </p>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed pt-1">
                {exam.description}
              </p>
            </div>

            {/* Quick Action Box */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shrink-0 min-w-[220px] text-center shadow-lg">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                {t('Preparation Status', 'तैयारी स्थिति')}
              </span>
              <p className="text-lg font-bold text-white mb-3">
                {mockTests.length} CBT Tests Ready
              </p>
              <button
                onClick={() => {
                  if (mockTests.length > 0) {
                    onNavigate('attempt-test', mockTests[0].id);
                  } else {
                    setActiveTab('tests');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{t('Start Mock Test', 'मॉक टेस्ट शुरू करें')}</span>
              </button>
            </div>
          </div>

          {/* Quick Specifications Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">{t('Conducting Body', 'परीक्षा आयोजक')}</span>
              <span className="font-semibold text-white">{exam.conducting_body || 'Examination Commission'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t('Eligibility', 'शैक्षणिक योग्यता')}</span>
              <span className="font-semibold text-white truncate block">{exam.eligibility || 'Graduate / 10+2'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t('Frequency', 'परीक्षा आवृत्ति')}</span>
              <span className="font-semibold text-white">{exam.frequency || 'Annual Cycle'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t('Language', 'माध्यम')}</span>
              <span className="font-semibold text-amber-400">Hindi & English Bilingual</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl px-2 shadow-sm text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: t('Overview & Pattern', 'अवलोकन व पैटर्न') },
            { id: 'syllabus', label: t(`Syllabus & Subjects (${subjects.length})`, `पाठ्यक्रम व विषय (${subjects.length})`) },
            { id: 'tests', label: t(`Mock Tests (${mockTests.length})`, `मॉक टेस्ट (${mockTests.length})`) },
            { id: 'materials', label: t(`Study Materials (${materials.length})`, `अध्ययन नोट्स (${materials.length})`) },
            { id: 'papers', label: t(`Previous Papers (${papers.length})`, `पुराने प्रश्नपत्र (${papers.length})`) }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Pattern */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>{t('Official Examination Pattern', 'परीक्षा पैटर्न व मार्किंग स्कीम')}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'The examination follows official NTA/BSEB computer-based evaluation standards. Candidates must manage time strictly within the allotted duration.',
                  'परीक्षा NTA/BSEB के आधिकारिक कंप्यूटर-आधारित मूल्यांकन नियमों के अनुसार आयोजित की जाती है।'
                )}
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold text-slate-800">{exam.pattern?.total_questions || 150} Questions</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Maximum Marks:</span>
                  <span className="font-bold text-slate-800">{exam.pattern?.total_marks || 150} Marks</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{exam.pattern?.duration_minutes || 150} Minutes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Negative Marking:</span>
                  <span className="font-bold text-rose-600">{exam.pattern?.negative_marking ? `-${exam.pattern.negative_marking} per wrong answer` : 'No Negative Marking'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>{t('Eligibility & Age Criteria', 'पात्रता व आयु सीमा')}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {exam.eligibility || 'Candidate must hold a recognized Bachelor degree / Intermediate with applicable category relaxation as per government recruitment notifications.'}
              </p>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-semibold text-xs text-slate-700 mb-2">Subject Distribution:</h4>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(sub => (
                    <span key={sub.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium">
                      {sub.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Syllabus */}
        {activeTab === 'syllabus' && (
          <div className="space-y-4">
            {subjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border border-slate-200">
                Detailed subject syllabus is being compiled according to the latest notification.
              </div>
            ) : (
              subjects.map((sub, idx) => (
                <div key={sub.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{sub.name}</h4>
                    </div>
                    {sub.code && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {sub.code}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 pl-9.5">
                    {sub.description || 'Core theoretical concepts, numerical applications, and previous year patterns.'}
                  </p>

                  {sub.chapters && sub.chapters.length > 0 && (
                    <div className="pl-9.5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {sub.chapters.map(ch => (
                        <div key={ch.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-700 font-medium truncate">{ch.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Mock Tests */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mockTests.map(test => (
              <div key={test.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      test.is_free ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {test.is_free ? 'Free Test' : 'Premium Mock'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{test.total_questions} Questions</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-2">{test.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{test.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-semibold">
                    <span>{test.duration_minutes} mins</span> • <span>{test.total_marks} Marks</span>
                  </div>
                  <button
                    onClick={() => onNavigate('attempt-test', test.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{t('Attempt Now', 'टेस्ट दें')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Materials */}
        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map(m => (
              <div key={m.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{m.title}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{m.file_size_mb} MB • {m.author}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('materials')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold shrink-0"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Papers */}
        {activeTab === 'papers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {papers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.year} {p.paper_type.toUpperCase()}
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">{p.paper_name}</h5>
                    <span className="text-[10px] text-slate-400">{p.total_questions} Questions • With Solution Key</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onNavigate('papers')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    View Paper
                  </button>
                  {p.cbt_test_id && (
                    <button
                      onClick={() => onNavigate('attempt-test', p.cbt_test_id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>CBT Test</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
