import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MockTest, Examination } from '../types';
import { Play, Lock, Clock, CheckCircle2, Search, Filter, ShieldAlert, Sparkles, Award } from 'lucide-react';

interface MockTestsCatalogPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const MockTestsCatalogPage: React.FC<MockTestsCatalogPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, t, hasEntitlement } = useAuth();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTests() {
      try {
        setIsLoading(true);
        const [testRes, examRes] = await Promise.all([
          api.tests.getTests(),
          api.exams.getExams()
        ]);
        if (testRes.success) setTests(testRes.tests || []);
        if (examRes.success) setExams(examRes.exams || []);
      } catch (err) {
        console.warn('Error loading mock tests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTests();
  }, []);

  const handleStartTest = (test: MockTest) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (!test.is_free && !hasEntitlement(test.exam_id)) {
      onNavigate('pricing');
      return;
    }

    onNavigate('attempt-test', test.id);
  };

  const filtered = tests.filter(t => {
    const matchExam = selectedExamId === 'all' || t.exam_id === selectedExamId;
    const matchAccess = accessFilter === 'all' ||
      (accessFilter === 'free' ? t.is_free === 1 : t.is_free === 0);
    const matchSearch = !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.exam_name && t.exam_name.toLowerCase().includes(search.toLowerCase()));
    return matchExam && matchAccess && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <Award className="w-4 h-4 text-amber-600" />
            <span>PARIKSHA TEST – CBT ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Online CBT Mock Tests & Test Series', 'ऑनलाइन कंप्यूटर आधारित मॉक टेस्ट')}
          </h1>
          <p className="text-sm text-slate-600">
            {t(
              'Simulate exact examination conditions with server-authoritative timer, official color palette, negative marking and comprehensive solutions.',
              'सर्वर-प्रमाणित टाइमर, आधिकारिक कलर पैलेट, निगेटिव मार्किंग और विस्तृत समाधान के साथ वास्तविक परीक्षा जैसी तैयारी।'
            )}
          </p>

          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-4.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tests by title or exam..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-slate-500">Filter Exam:</span>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Examinations</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-semibold">
            <button
              onClick={() => setAccessFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                accessFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setAccessFilter('free')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                accessFilter === 'free' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              Free Demo Tests
            </button>
            <button
              onClick={() => setAccessFilter('premium')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                accessFilter === 'premium' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-700'
              }`}
            >
              Premium Series
            </button>
          </div>
        </div>

        {/* Test Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading CBT mock tests...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-xs">
            No mock tests found matching this filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(test => {
              const isLocked = test.is_free === 0 && !hasEntitlement(test.exam_id);

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {test.exam_name || 'Competitive'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        test.is_free ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {test.is_free ? 'Free Demo' : 'Premium'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2 leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {test.description}
                    </p>

                    {/* Test Spec Badges */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Time', 'समय')}</span>
                        <span className="font-bold text-slate-800">{test.duration_minutes}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Questions', 'प्रश्न')}</span>
                        <span className="font-bold text-slate-800">{test.total_questions}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Negative', 'निगेटिव')}</span>
                        <span className="font-bold text-rose-600">
                          {test.negative_marking > 0 ? `-${test.negative_marking}` : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">
                      {test.total_marks} Total Marks
                    </span>

                    <button
                      onClick={() => handleStartTest(test)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        isLocked
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock with Pass</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t('Attempt CBT Test', 'टेस्ट शुरू करें')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
