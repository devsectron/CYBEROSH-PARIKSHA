import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ModelPaper, Examination } from '../types';
import { PdfDocumentViewer } from '../components/PdfDocumentViewer';
import { downloadPdfFile } from '../utils/downloadHelper';
import {
  FileText,
  Download,
  Play,
  Search,
  CheckCircle2,
  Calendar,
  Eye,
  X,
  BookOpen,
  Sparkles,
  Code2,
  FileCheck,
  Check,
  HelpCircle,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface ModelPapersPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ModelPapersPage: React.FC<ModelPapersPageProps> = ({ onNavigate }) => {
  const { t } = useAuth();
  const [papers, setPapers] = useState<ModelPaper[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [paperTypeFilter, setPaperTypeFilter] = useState<'all' | 'pyq' | 'model'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewPaper, setPreviewPaper] = useState<ModelPaper | null>(null);
  const [modalTab, setModalTab] = useState<'viewer' | 'blueprint'>('viewer');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [paperRes, examRes] = await Promise.all([
          api.content.getPapers(),
          api.exams.getExams()
        ]);
        if (paperRes.success) setPapers(paperRes.papers || []);
        if (examRes.success) setExams(examRes.exams || []);
      } catch (err) {
        console.warn('Error fetching papers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = async (paper: ModelPaper) => {
    if (!paper.pdf_url) return;
    try {
      setDownloadingId(paper.id);
      const cleanName = paper.paper_name.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_');
      await downloadPdfFile(paper.pdf_url, cleanName);
    } finally {
      setDownloadingId(null);
    }
  };

  const bsebCount = papers.filter(p => p.exam_id === 'exam_bseb_12_cs').length;

  const filtered = papers.filter(p => {
    const matchExam = selectedExamId === 'all' || p.exam_id === selectedExamId;
    const matchType = paperTypeFilter === 'all' || p.paper_type === paperTypeFilter;
    const matchYear = selectedYear === 'all' || String(p.year) === selectedYear;
    const matchSearch =
      searchQuery.trim() === '' ||
      p.paper_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.exam_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subject_code && p.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchExam && matchType && matchYear && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>PARIKSHA MODEL PAPERS REPOSITORY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Previous Year Papers & Model Question Sets', 'पिछले वर्षों के प्रश्नपत्र व मॉडल पेपर्स')}
          </h1>
          <p className="text-sm text-slate-600">
            {t(
              'Authentic bilingual examination question papers with official answer keys, marking criteria and step-by-step solutions for practice.',
              'अभ्यास के लिए आधिकारिक उत्तर कुंजी, अंकन योजना और विस्तृत समाधान के साथ प्रामाणिक द्विभाषी मॉडल प्रश्नपत्र।'
            )}
          </p>
        </div>

        {/* Featured Spotlight: Bihar Board XII Computer Science 10 Model Sets */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  BSEB Class 12 Intermediate (Board 2026)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Subject Code: 122 / 221 / 328
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  10 Bilingual Sets Available
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bihar Board XII Computer Science (Theory) — 10 Complete Model Sets
              </h2>

              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Complete set of 10 official-format bilingual model question papers designed strictly per the latest Bihar School Examination Board blueprint: 70 Objective MCQs (attempt 35) + 20 Short Answer Questions (attempt 10) + 6 Long Answer Questions (attempt 3). Every set includes a full answer key and step-by-step C++, Data Structures, and SQL solutions.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 pt-1">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-300" /> C++, OOP & Data Structures
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-300" /> Full Answer Keys & SQL Solutions
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-300" /> 2026 Examination Edition
                </span>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  setSelectedExamId('exam_bseb_12_cs');
                  setSelectedYear('all');
                  setPaperTypeFilter('all');
                  setSearchQuery('');
                }}
                className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                <BookOpen className="w-4 h-4" />
                <span>Filter 10 BSEB Sets</span>
              </button>
              {papers.find(p => p.exam_id === 'exam_bseb_12_cs') && (
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                  <button
                    onClick={() => setPreviewPaper(papers.find(p => p.exam_id === 'exam_bseb_12_cs') || null)}
                    className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Set 01</span>
                  </button>
                  <button
                    onClick={() => onNavigate('attempt-test', 'test_bseb_12_cs_set_01')}
                    className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Attempt CBT Set 01</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Quick Select:</span>
            <button
              onClick={() => {
                setSelectedExamId('all');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedExamId === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Papers ({papers.length})
            </button>
            <button
              onClick={() => {
                setSelectedExamId('exam_bseb_12_cs');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedExamId === 'exam_bseb_12_cs'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bihar Board 12th CS ({bsebCount})</span>
            </button>
            {exams
              .filter(e => e.id !== 'exam_bseb_12_cs' && papers.some(p => p.exam_id === e.id))
              .map(e => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedExamId(e.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedExamId === e.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {e.name}
                </button>
              ))}
          </div>

          {/* Filter & Search Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search set number, C++, SQL..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Exam:</span>
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

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Year:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-semibold">
              <button
                onClick={() => setPaperTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paperTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setPaperTypeFilter('model')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paperTypeFilter === 'model' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800'
                }`}
              >
                Model Sets
              </button>
              <button
                onClick={() => setPaperTypeFilter('pyq')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paperTypeFilter === 'pyq' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700'
                }`}
              >
                Official PYQs
              </button>
            </div>
          </div>
        </div>

        {/* Papers List */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading model papers repository...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 text-slate-600 text-xs space-y-3">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-sm text-slate-800">No question papers matched your criteria.</p>
            <p className="text-slate-500">Try clearing the search query or resetting the examination filter.</p>
            <button
              onClick={() => {
                setSelectedExamId('all');
                setSelectedYear('all');
                setPaperTypeFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
              <span>Showing {filtered.length} paper{filtered.length !== 1 ? 's' : ''}</span>
              {selectedExamId === 'exam_bseb_12_cs' && (
                <span className="text-blue-600 font-semibold">Bihar Board XII Computer Science Model Sets 01–10</span>
              )}
            </div>

            {filtered.map(paper => (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {paper.year} • {paper.paper_type === 'model' ? 'MODEL SET' : 'OFFICIAL PYQ'}
                      </span>

                      <span className="text-xs text-blue-700 font-bold">{paper.exam_name}</span>

                      {paper.subject_code && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Code: {paper.subject_code}
                        </span>
                      )}

                      {paper.has_full_solutions && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Bilingual + Solutions
                        </span>
                      )}

                      {paper.cbt_test_id && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          Interactive CBT Ready
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {paper.paper_name}
                    </h3>

                    {paper.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {paper.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 pt-1">
                      <span className="font-medium text-slate-700">{paper.total_questions} Questions</span>
                      <span>•</span>
                      <span>{paper.duration_minutes} Mins Duration</span>
                      <span>•</span>
                      <span>Full Marks: {paper.max_marks}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Full Answer Key & Explanations Included
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center shrink-0 w-full sm:w-auto justify-end">
                  {paper.pdf_url && (
                    <button
                      onClick={() => setPreviewPaper(paper)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Preview & Read</span>
                    </button>
                  )}

                  {paper.pdf_url ? (
                    <button
                      onClick={() => handleDownload(paper)}
                      disabled={downloadingId === paper.id}
                      className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === paper.id ? 'animate-bounce text-blue-700' : 'text-blue-600'}`} />
                      <span>{downloadingId === paper.id ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
                    >
                      <span>PDF Coming Soon</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (paper.cbt_test_id) {
                        onNavigate('attempt-test', paper.cbt_test_id);
                      } else {
                        onNavigate('mock-tests');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer ${
                      paper.cbt_test_id
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{paper.cbt_test_id ? 'Take CBT Test' : 'Practice Online'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: In-App PDF Canvas Viewer and Blueprint */}
        {previewPaper && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full h-[94vh] flex flex-col overflow-hidden border border-slate-700/80">
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="space-y-1 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {previewPaper.year} • {previewPaper.paper_type === 'model' ? 'MODEL SET' : 'OFFICIAL PYQ'}
                    </span>
                    {previewPaper.subject_code && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Subject Code: {previewPaper.subject_code}
                      </span>
                    )}
                    <span className="text-xs text-slate-300 hidden md:inline">{previewPaper.exam_name}</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-xl">
                    {previewPaper.paper_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Tabs */}
                  <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold mr-2">
                    <button
                      onClick={() => setModalTab('viewer')}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        modalTab === 'viewer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF Document</span>
                    </button>
                    <button
                      onClick={() => setModalTab('blueprint')}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        modalTab === 'blueprint' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Blueprint & Answers</span>
                    </button>
                  </div>

                  {previewPaper.pdf_url && (
                    <button
                      onClick={() => handleDownload(previewPaper)}
                      disabled={downloadingId === previewPaper.id}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === previewPaper.id ? 'animate-bounce' : ''}`} />
                      <span className="hidden sm:inline">{downloadingId === previewPaper.id ? 'Downloading...' : 'Download'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewPaper(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="sm:hidden flex items-center justify-around bg-slate-850 border-b border-slate-800 px-3 py-2 text-xs font-semibold">
                <button
                  onClick={() => setModalTab('viewer')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                    modalTab === 'viewer' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Document</span>
                </button>
                <button
                  onClick={() => setModalTab('blueprint')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                    modalTab === 'blueprint' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Blueprint & Key</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
                {modalTab === 'viewer' ? (
                  previewPaper.pdf_url ? (
                    <PdfDocumentViewer
                      url={previewPaper.pdf_url}
                      title={previewPaper.paper_name}
                      onDownload={() => handleDownload(previewPaper)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      PDF file path is not configured.
                    </div>
                  )
                ) : (
                  /* Blueprint & Structure View */
                  <div className="h-full overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-100 bg-slate-900">
                    <div className="max-w-3xl mx-auto space-y-6">
                      <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          <span>Official BSEB 12th Examination Blueprint</span>
                        </div>
                        <h4 className="text-lg font-extrabold text-white">
                          Bihar School Examination Board — Class XII Computer Science (Theory)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-slate-400 block text-[11px]">Subject Code</span>
                            <span className="font-bold text-amber-300 text-sm">122 / 221 / 328</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-slate-400 block text-[11px]">Full Marks</span>
                            <span className="font-bold text-emerald-300 text-sm">70 Marks</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-slate-400 block text-[11px]">Total Time</span>
                            <span className="font-bold text-blue-300 text-sm">3h 15m (195m)</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-slate-400 block text-[11px]">Questions</span>
                            <span className="font-bold text-purple-300 text-sm">96 Total</span>
                          </div>
                        </div>
                      </div>

                      {/* Section Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                              SECTION A (Objective)
                            </span>
                            <span className="text-xs font-bold text-emerald-400">35 Marks Total</span>
                          </div>
                          <h5 className="font-bold text-white text-sm">70 Multiple Choice Questions (MCQs)</h5>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                            <li>Contains 70 bilingual Objective Questions (Q1 to Q70).</li>
                            <li>Candidate is required to answer <strong className="text-white">any 35 questions</strong> only.</li>
                            <li>Each correct answer carries 1 mark.</li>
                            <li>If more than 35 questions are attempted, only the first 35 will be evaluated.</li>
                            <li>OMR answer sheet shading or CBT selection mode.</li>
                          </ul>
                        </div>

                        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
                              SECTION B (Descriptive)
                            </span>
                            <span className="text-xs font-bold text-emerald-400">35 Marks Total</span>
                          </div>
                          <h5 className="font-bold text-white text-sm">Short & Long Descriptive Questions</h5>
                          <div className="text-xs text-slate-300 space-y-2">
                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                              <div className="font-semibold text-white">Short Answer (20 Questions):</div>
                              <p className="text-[11px] text-slate-400">Answer any 10 questions (2 marks each = 20 marks).</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                              <div className="font-semibold text-white">Long Answer (6 Questions):</div>
                              <p className="text-[11px] text-slate-400">Answer any 3 questions (5 marks each = 15 marks).</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Syllabus & Topic Weightage */}
                      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-3">
                        <h5 className="font-bold text-white text-sm flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-400" />
                          <span>Core Syllabus Modules Covered in This Model Set</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-1">
                            <span className="font-bold text-amber-300">1. C++ & Object-Oriented Programming</span>
                            <p className="text-[11px] text-slate-400">Classes, objects, constructors, destructors, inheritance hierarchy, file I/O streams, pointers & arrays.</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-1">
                            <span className="font-bold text-emerald-300">2. Data Structures</span>
                            <p className="text-[11px] text-slate-400">Stacks (PUSH/POP algorithms), Linear & Circular Queues, Linked Lists, FIFO & LIFO concepts.</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-1">
                            <span className="font-bold text-blue-300">3. DBMS & Structured Query Language</span>
                            <p className="text-[11px] text-slate-400">Primary/Foreign/Candidate keys, SELECT, WHERE, GROUP BY, ORDER BY, aggregate functions (COUNT, SUM, AVG).</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-1">
                            <span className="font-bold text-purple-300">4. Boolean Algebra & Networking</span>
                            <p className="text-[11px] text-slate-400">Logic gates, Truth tables, K-Map SOP/POS minimization, De Morgan laws, OSI layers, topologies, cyber safety.</p>
                          </div>
                        </div>
                      </div>

                      {/* Answer Key Notice */}
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <h6 className="font-bold text-emerald-200">Verified Answer Key & Code Solutions Included</h6>
                          <p className="text-emerald-300/80 text-[11px] leading-relaxed">
                            The PDF document contains complete official answer keys for all 70 MCQs followed by worked-out C++ code and SQL queries for the Section B descriptive questions. Switch to the <strong>PDF Document</strong> tab to view every page directly!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
                <span className="hidden sm:inline">BSEB Intermediate Class 12 Computer Science Model Practice Set</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      const targetCbtId = previewPaper.cbt_test_id || 'test_bseb_12_cs_set_01';
                      setPreviewPaper(null);
                      onNavigate('attempt-test', targetCbtId);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Take Interactive CBT Test</span>
                  </button>
                  <button
                    onClick={() => setPreviewPaper(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


