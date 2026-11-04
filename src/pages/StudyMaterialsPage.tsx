import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StudyMaterial, Examination } from '../types';
import { BookOpen, Download, Search, Lock, CheckCircle, FileText, X, ExternalLink, Bookmark } from 'lucide-react';

interface StudyMaterialsPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const StudyMaterialsPage: React.FC<StudyMaterialsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, t, hasEntitlement } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [matRes, examRes] = await Promise.all([
          api.content.getMaterials(),
          api.exams.getExams()
        ]);
        if (matRes.success) setMaterials(matRes.materials || []);
        if (examRes.success) setExams(examRes.exams || []);
      } catch (err) {
        console.warn('Error loading materials:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = async (mat: StudyMaterial) => {
    if (mat.access_level === 'premium' && !user) {
      onOpenAuth('login');
      return;
    }

    if (mat.access_level === 'premium' && !hasEntitlement(mat.exam_id)) {
      onNavigate('pricing');
      return;
    }

    try {
      const res = await api.content.downloadMaterial(mat.id);
      if (res.success) {
        // Open PDF reader preview
        setPreviewMaterial(mat);
      } else {
        alert(res.message || 'Unable to download material.');
      }
    } catch (err: any) {
      alert(err.message || 'Download request failed.');
    }
  };

  const filtered = materials.filter(m => {
    const matchExam = selectedExamId === 'all' || m.exam_id === selectedExamId;
    const matchAccess = accessFilter === 'all' || m.access_level === accessFilter;
    const matchSearch = !search.trim() ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase());
    return matchExam && matchAccess && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>PARIKSHA LIBRARY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Digital Study Materials & Notes', 'डिजिटल अध्ययन सामग्री व नोट्स')}
          </h1>
          <p className="text-sm text-slate-600">
            {t(
              'High-yield revision notes, NCERT line-by-line extracts, Bihar Special handbooks and formula sheets curated by faculty.',
              'विशेषज्ञ शिक्षकों द्वारा तैयार किए गए उच्च-स्तरीय नोट्स, NCERT सार संग्रह, बिहार स्पेशल और फॉर्मूला हैंडबुक्स।'
            )}
          </p>

          {/* Search Input */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-4.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes by subject, topic or author..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
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
              All Access
            </button>
            <button
              onClick={() => setAccessFilter('free')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                accessFilter === 'free' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              Free Notes
            </button>
            <button
              onClick={() => setAccessFilter('premium')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                accessFilter === 'premium' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-700'
              }`}
            >
              Premium Pass
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading library materials...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-xs">
            No study materials found for this selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(mat => {
              const isLocked = mat.access_level === 'premium' && !hasEntitlement(mat.exam_id);

              return (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {mat.exam_name || 'General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        mat.access_level === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {mat.access_level}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1.5 line-clamp-2">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                      {mat.description}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Author: {mat.author}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">
                      {mat.file_size_mb} MB • {mat.downloads_count} downloads
                    </span>

                    <button
                      onClick={() => handleDownload(mat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        isLocked
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock with Pass</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Read & Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PDF Reader Preview Modal */}
        {previewMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-sm truncate max-w-lg">{previewMaterial.title}</h4>
                    <span className="text-[10px] text-slate-400">{previewMaterial.author} • {previewMaterial.file_size_mb} MB PDF</span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-Browser PDF Reader Simulation */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4 text-xs leading-relaxed text-slate-700">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">CYBEROSH PARIKSHA ACADEMIC MONOGRAPH</span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">{previewMaterial.title}</h2>
                    <p className="text-slate-500 text-[11px] mt-0.5">Authoritative revision module for competitive candidates</p>
                  </div>

                  <p className="text-slate-800 font-medium">
                    {previewMaterial.description}
                  </p>

                  <div className="space-y-3 pt-2 text-slate-600">
                    <h4 className="font-bold text-slate-800 text-xs">Key Theoretical Postulates & Formula Framework:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Complete pedagogical alignment with state and national examination guidelines.</li>
                      <li>Standardized definitions, dimensional deductions, and previous decade frequency analysis.</li>
                      <li>Core shortcut techniques and conceptual frameworks verified by subject matter experts.</li>
                      <li>Comparative tables and mnemonic acronyms for high-speed recall during examination CBT conditions.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs">
                    <span className="font-bold block mb-1">Notice for Offline Download:</span>
                    <span>This full high-resolution PDF study handbook has been verified and authorized for offline study under your CYBEROSH PARIKSHA student account.</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Document authenticated by CYBEROSH Academic Cell</span>
                <button
                  onClick={() => {
                    alert('PDF successfully downloaded to your device.');
                    setPreviewMaterial(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PDF to Device</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
