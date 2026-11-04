import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TestAttempt, Entitlement, StudyMaterial } from '../types';
import {
  LayoutDashboard,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  RotateCcw,
  Play,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bookmark,
  Zap
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string, param?: string) => void;
  onViewResult: (attemptId: string) => void;
  onAttemptTest: (testId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onViewResult,
  onAttemptTest
}) => {
  const { user, entitlements, t } = useAuth();
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [histRes, bmRes] = await Promise.all([
          api.tests.getMyHistory(),
          api.content.getBookmarks()
        ]);
        if (histRes.success) setHistory(histRes.history || []);
        if (bmRes.success) setBookmarks(bmRes.bookmarks || []);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalAttempted = history.filter(h => h.status === 'submitted').length;
  const avgAccuracy = totalAttempted > 0
    ? (history.reduce((acc, h) => acc + (h.accuracy || 0), 0) / totalAttempted).toFixed(1)
    : '0.0';
  const bestPercentile = totalAttempted > 0
    ? Math.max(...history.map(h => h.percentile || 0)).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Aspirant'}
              alt={user?.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {user?.state || 'Bihar'} Candidate
                </span>
                <span className="text-xs text-slate-400">Target Year: {user?.preparation_year || 2026}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {user?.full_name || 'Aspirant'}
              </h1>
              <p className="text-xs text-slate-300">
                Email: {user?.email} • Student ID: {user?.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">{t('Active Streak', 'सक्रिय स्ट्रीक')}</span>
                <span className="text-xl font-extrabold text-white">{user?.streak_days || 7} Days</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('mock-tests')}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('Attempt Next Test', 'नया टेस्ट दें')}</span>
            </button>
          </div>
        </div>

        {/* 4 Performance KPI Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">{t('Tests Attempted', 'मॉक टेस्ट दिए')}</span>
              <span className="text-2xl font-bold text-slate-900">{totalAttempted}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">{t('Average Accuracy', 'औसत सटीकता')}</span>
              <span className="text-2xl font-bold text-slate-900">{avgAccuracy}%</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">{t('Peak Percentile', 'उच्चतम पर्सेंटाइल')}</span>
              <span className="text-2xl font-bold text-slate-900">{bestPercentile}%ile</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">{t('Active Passes', 'सक्रिय पास')}</span>
              <span className="text-2xl font-bold text-slate-900">{entitlements.length || 1}</span>
            </div>
          </div>
        </div>

        {/* Active Entitlements & Preparation Passes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{t('Active Subscriptions & Entitlements', 'सक्रिय तैयारी पास')}</span>
            </h3>
            <button
              onClick={() => onNavigate('pricing')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              + Upgrade / Add Pass
            </button>
          </div>

          {entitlements.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Pariksha Free Starter Pass Active</span>
                <p className="text-slate-500">Access to all free demo mock tests and daily quiz revisions.</p>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Upgrade to Full Pass
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entitlements.map(ent => (
                <div key={ent.id} className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-950 text-sm">{ent.plan_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">Active</span>
                  </div>
                  <p className="text-emerald-800 font-medium text-[11px]">
                    Valid Until: {new Date(ent.end_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Attempt History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {t('Recent Examination Attempts & Performance', 'हालिया परीक्षा प्रयास व परिणाम')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed question-by-question review and negative-marking deduction analytics
              </p>
            </div>
            <button
              onClick={() => onNavigate('mock-tests')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Browse More Tests
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
              You haven't attempted any mock examinations yet. Start your first CBT test now!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {history.map(attempt => (
                    <tr key={attempt.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{attempt.test_title}</span>
                        <span className="text-[11px] text-slate-400">{attempt.exam_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {attempt.total_score} <span className="text-slate-400 text-[10px]">/ {attempt.max_marks}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          attempt.accuracy >= 75 ? 'bg-emerald-50 text-emerald-700' :
                          attempt.accuracy >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {attempt.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                        #{attempt.rank || 1} ({attempt.percentile || 90}%ile)
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => onViewResult(attempt.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                        >
                          View Result
                        </button>
                        <button
                          onClick={() => onAttemptTest(attempt.test_id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Re-attempt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
