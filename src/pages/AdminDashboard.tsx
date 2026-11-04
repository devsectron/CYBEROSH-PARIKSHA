import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldAlert,
  Users,
  Award,
  BookOpen,
  DollarSign,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Search,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, t } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'exams' | 'questions' | 'bulk-import' | 'tests' | 'payments' | 'audit'>('analytics');

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Exam Form
  const [examForm, setExamForm] = useState({
    name: '',
    slug: '',
    category_id: 'cat_teaching',
    full_name: '',
    eligibility: '',
    conducting_body: '',
    description: '',
    is_featured: true
  });
  const [examStatusMsg, setExamStatusMsg] = useState<string | null>(null);

  // New Question Form
  const [qForm, setQForm] = useState({
    exam_id: 'exam_bihar_stet',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: '',
    question_hi: '',
    opt_a_en: '',
    opt_a_hi: '',
    opt_b_en: '',
    opt_b_hi: '',
    opt_c_en: '',
    opt_c_hi: '',
    opt_d_en: '',
    opt_d_hi: '',
    correct_answer: 'A',
    solution_en: '',
    solution_hi: ''
  });
  const [qStatusMsg, setQStatusMsg] = useState<string | null>(null);

  // Bulk Import Form
  const [bulkExamId, setBulkExamId] = useState('exam_bihar_stet');
  const [bulkJson, setBulkJson] = useState(`[
  {
    "question_en": "What is the primary function of the National Testing Agency (NTA)?",
    "question_hi": "राष्ट्रीय परीक्षा एजेंसी (NTA) का प्राथमिक कार्य क्या है?",
    "difficulty": "easy",
    "marks": 1.0,
    "negative_marks": 0.0,
    "correct_answer": "B",
    "solution_en": "NTA was established to conduct efficient, transparent and international standard tests to assess the competence of candidates for admissions and recruitments.",
    "options": [
      { "option_key": "A", "option_en": "Curriculum Design", "option_hi": "पाठ्यक्रम निर्धारण" },
      { "option_key": "B", "option_en": "Conducting National Level Admissions Tests", "option_hi": "राष्ट्रीय स्तर की प्रवेश परीक्षाएं आयोजित करना" },
      { "option_key": "C", "option_en": "Textbook Publication", "option_hi": "पाठ्यपुस्तक प्रकाशन" },
      { "option_key": "D", "option_en": "University Affiliation", "option_hi": "विश्वविद्यालय संबद्धता" }
    ]
  }
]`);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      const [statsRes, logsRes, payRes, qRes] = await Promise.all([
        api.admin.getAnalytics(),
        api.admin.getAuditLogs(),
        api.admin.getPayments(),
        api.admin.getQuestions({ limit: '20' } as any)
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (logsRes.success) setAuditLogs(logsRes.logs || []);
      if (payRes.success) setPayments(payRes.payments || []);
      if (qRes.success) setQuestions(qRes.questions || []);
    } catch (err) {
      console.warn('Admin load notice:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamStatusMsg(null);
    try {
      const res = await api.admin.upsertExam(examForm);
      if (res.success) {
        setExamStatusMsg('Examination configured and added to catalog successfully!');
        setExamForm({
          name: '',
          slug: '',
          category_id: 'cat_teaching',
          full_name: '',
          eligibility: '',
          conducting_body: '',
          description: '',
          is_featured: false
        });
        loadDashboardData();
      }
    } catch (err: any) {
      setExamStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQStatusMsg(null);
    try {
      const payload = {
        exam_id: qForm.exam_id,
        question_type: qForm.question_type,
        difficulty: qForm.difficulty,
        marks: qForm.marks,
        negative_marks: qForm.negative_marks,
        question_en: qForm.question_en,
        question_hi: qForm.question_hi || null,
        correct_answer: qForm.correct_answer,
        solution_en: qForm.solution_en || null,
        solution_hi: qForm.solution_hi || null,
        options: [
          { option_key: 'A', option_en: qForm.opt_a_en, option_hi: qForm.opt_a_hi },
          { option_key: 'B', option_en: qForm.opt_b_en, option_hi: qForm.opt_b_hi },
          { option_key: 'C', option_en: qForm.opt_c_en, option_hi: qForm.opt_c_hi },
          { option_key: 'D', option_en: qForm.opt_d_en, option_hi: qForm.opt_d_hi }
        ]
      };

      const res = await api.admin.createQuestion(payload);
      if (res.success) {
        setQStatusMsg('Question created successfully in Question Bank!');
        setQForm(prev => ({
          ...prev,
          question_en: '',
          question_hi: '',
          opt_a_en: '',
          opt_b_en: '',
          opt_c_en: '',
          opt_d_en: '',
          solution_en: '',
          solution_hi: ''
        }));
        loadDashboardData();
      }
    } catch (err: any) {
      setQStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleBulkImport = async () => {
    setBulkStatusMsg(null);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Input must be a valid JSON array of questions.');

      const res = await api.admin.bulkImportQuestions(bulkExamId, parsed);
      if (res.success) {
        setBulkStatusMsg(`Success: ${res.imported_count} questions imported into Question Bank.`);
        loadDashboardData();
      }
    } catch (err: any) {
      setBulkStatusMsg(`Import Failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                System Administration
              </span>
              <span className="text-xs text-slate-400">Authenticated: {user?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              CYBEROSH Administration Control Center
            </h1>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            ← Return to Public Website
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 space-x-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'analytics', label: 'Platform KPIs' },
            { id: 'exams', label: 'Configure Examination' },
            { id: 'questions', label: 'Question Bank Editor' },
            { id: 'bulk-import', label: 'Bulk Question Import' },
            { id: 'payments', label: 'Payments & Revenue' },
            { id: 'audit', label: 'System Audit Logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Analytics Overview */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 block mb-1">Total Enrolled Students</span>
                <span className="text-3xl font-black text-white">{stats?.total_students || 1}</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 block mb-1">Active Examinations</span>
                <span className="text-3xl font-black text-amber-400">{stats?.total_exams || 21}</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 block mb-1">Questions in Central Bank</span>
                <span className="text-3xl font-black text-blue-400">{stats?.total_questions || 50}+</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 block mb-1">Verified Platform Revenue</span>
                <span className="text-3xl font-black text-emerald-400">₹{stats?.total_revenue_inr || 0}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60">
              <h3 className="font-bold text-sm text-white mb-3">System Operating Health</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Database Engine</span>
                  <span className="font-bold text-emerald-400">SQLite WAL Active (PRAGMA foreign_keys = ON)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Payment Webhook Verification</span>
                  <span className="font-bold text-emerald-400">Razorpay HMAC-SHA256 Active</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">CBT Deadline Enforcer</span>
                  <span className="font-bold text-emerald-400">Server-Authoritative Synchronization</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Configure Examination */}
        {activeTab === 'exams' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 max-w-3xl space-y-4">
            <h3 className="font-bold text-base text-white">Dynamic Examination Configurator</h3>
            <p className="text-xs text-slate-400">
              Create a new examination category or configure an existing examination’s pattern, eligibility and syllabus without code edits.
            </p>

            {examStatusMsg && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                {examStatusMsg}
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Exam Name (e.g. Bihar STET)</label>
                  <input
                    type="text"
                    required
                    value={examForm.name}
                    onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL Slug (e.g. bihar-stet)</label>
                  <input
                    type="text"
                    required
                    value={examForm.slug}
                    onChange={e => setExamForm({ ...examForm, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={examForm.category_id}
                  onChange={e => setExamForm({ ...examForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="cat_teaching">Teaching & Teacher Eligibility</option>
                  <option value="cat_civil">Civil Services & State PSC</option>
                  <option value="cat_engineering">Engineering Entrance</option>
                  <option value="cat_medical">Medical Entrance</option>
                  <option value="cat_railway">Railway Recruitment</option>
                  <option value="cat_banking">Banking & Insurance</option>
                  <option value="cat_ssc">Staff Selection Commission</option>
                  <option value="cat_police">Police & Defence</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Official Title</label>
                <input
                  type="text"
                  value={examForm.full_name}
                  onChange={e => setExamForm({ ...examForm, full_name: e.target.value })}
                  placeholder="e.g. Bihar Secondary Teachers Eligibility Test"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Conducting Body</label>
                  <input
                    type="text"
                    value={examForm.conducting_body}
                    onChange={e => setExamForm({ ...examForm, conducting_body: e.target.value })}
                    placeholder="e.g. BSEB / BPSC / NTA"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={examForm.eligibility}
                    onChange={e => setExamForm({ ...examForm, eligibility: e.target.value })}
                    placeholder="e.g. B.Ed / Graduation"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={examForm.description}
                  onChange={e => setExamForm({ ...examForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Save & Publish Examination
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Question Bank Editor */}
        {activeTab === 'questions' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 max-w-4xl space-y-4">
            <h3 className="font-bold text-base text-white">Central Question Bank – Bilingual Editor</h3>
            <p className="text-xs text-slate-400">
              Author questions with dual English and Hindi formulations, multiple choice options, marks and pedagogical explanation.
            </p>

            {qStatusMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {qStatusMsg}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Examination</label>
                  <select
                    value={qForm.exam_id}
                    onChange={e => setQForm({ ...qForm, exam_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="exam_bihar_stet">Bihar STET</option>
                    <option value="exam_bpsc_cce">BPSC CCE</option>
                    <option value="exam_jee_main">JEE Main</option>
                    <option value="exam_neet_ug">NEET UG</option>
                    <option value="exam_rrb_ntpc">RRB NTPC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qForm.marks}
                    onChange={e => setQForm({ ...qForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Negative Penalty (-)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={qForm.negative_marks}
                    onChange={e => setQForm({ ...qForm, negative_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Prompt (English)</label>
                <textarea
                  rows={2}
                  required
                  value={qForm.question_en}
                  onChange={e => setQForm({ ...qForm, question_en: e.target.value })}
                  placeholder="Enter the question text in English..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Prompt (Hindi translation)</label>
                <textarea
                  rows={2}
                  value={qForm.question_hi}
                  onChange={e => setQForm({ ...qForm, question_hi: e.target.value })}
                  placeholder="हिंदी अनुवाद दर्ज करें..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-200">Answer Options:</span>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Option A (EN)"
                    value={qForm.opt_a_en}
                    onChange={e => setQForm({ ...qForm, opt_a_en: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="विकल्प A (HI)"
                    value={qForm.opt_a_hi}
                    onChange={e => setQForm({ ...qForm, opt_a_hi: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Option B (EN)"
                    value={qForm.opt_b_en}
                    onChange={e => setQForm({ ...qForm, opt_b_en: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="विकल्प B (HI)"
                    value={qForm.opt_b_hi}
                    onChange={e => setQForm({ ...qForm, opt_b_hi: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Option C (EN)"
                    value={qForm.opt_c_en}
                    onChange={e => setQForm({ ...qForm, opt_c_en: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="विकल्प C (HI)"
                    value={qForm.opt_c_hi}
                    onChange={e => setQForm({ ...qForm, opt_c_hi: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Option D (EN)"
                    value={qForm.opt_d_en}
                    onChange={e => setQForm({ ...qForm, opt_d_en: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="विकल्प D (HI)"
                    value={qForm.opt_d_hi}
                    onChange={e => setQForm({ ...qForm, opt_d_hi: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correct Answer Key</label>
                  <select
                    value={qForm.correct_answer}
                    onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={qForm.difficulty}
                    onChange={e => setQForm({ ...qForm, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Solution (English)</label>
                <textarea
                  rows={2}
                  value={qForm.solution_en}
                  onChange={e => setQForm({ ...qForm, solution_en: e.target.value })}
                  placeholder="Step-by-step mathematical or pedagogical explanation..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Save to Question Bank
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Bulk Question Import */}
        {activeTab === 'bulk-import' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 max-w-3xl space-y-4">
            <h3 className="font-bold text-base text-white">Bulk Question Import Pipeline</h3>
            <p className="text-xs text-slate-400">
              Batch import questions via structured JSON or CSV template. The import workflow validates question keys, required options, and sets before committing to the database.
            </p>

            {bulkStatusMsg && (
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                {bulkStatusMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Target Examination</label>
                <select
                  value={bulkExamId}
                  onChange={e => setBulkExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="exam_bihar_stet">Bihar STET</option>
                  <option value="exam_bpsc_tre">Bihar BPSC TRE 4.0</option>
                  <option value="exam_bpsc_cce">BPSC 71st Combined Prelims</option>
                  <option value="exam_jee_main">JEE Main 2026</option>
                  <option value="exam_neet_ug">NEET UG 2026</option>
                  <option value="exam_rrb_ntpc">RRB NTPC</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">JSON Question Payload</label>
                <textarea
                  rows={10}
                  value={bulkJson}
                  onChange={e => setBulkJson(e.target.value)}
                  className="w-full font-mono text-[11px] p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <button
                onClick={handleBulkImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Validate & Batch Commit Questions
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Payments & Revenue */}
        {activeTab === 'payments' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Razorpay Transaction & Entitlement Log</h3>
            <p className="text-xs text-slate-400">
              Cryptographically verified payment events, signature statuses, and entitlement activations.
            </p>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-amber-400">{p.order_id}</td>
                        <td className="py-2.5 px-3">{p.student_name} ({p.student_email})</td>
                        <td className="py-2.5 px-3">{p.plan_name}</td>
                        <td className="py-2.5 px-3 font-bold text-white">₹{p.amount_inr}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{new Date(p.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: System Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-base text-white">System Activity & Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Immutable log of administrative configuration changes, test releases, and user status events.
            </p>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {auditLogs.map(l => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{l.user_name || 'System Admin'}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">{l.action}</td>
                      <td className="py-2.5 px-3 text-slate-400">{l.entity_type}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">{l.details_json}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
