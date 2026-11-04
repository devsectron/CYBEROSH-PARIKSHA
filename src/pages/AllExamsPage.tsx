import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Examination, ExamCategory } from '../types';
import { GraduationCap, Search, ArrowRight, BookOpen, Clock, FileText, ChevronRight, ExternalLink } from 'lucide-react';

interface AllExamsPageProps {
  initialSearch?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const AllExamsPage: React.FC<AllExamsPageProps> = ({ initialSearch = '', onNavigate }) => {
  const { t } = useAuth();
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>(initialSearch);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [catRes, examRes] = await Promise.all([
          api.exams.getCategories(),
          api.exams.getExams()
        ]);
        if (catRes.success) setCategories(catRes.categories || []);
        if (examRes.success) setExams(examRes.exams || []);
      } catch (err) {
        console.warn('Error fetching exams:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = exams.filter(e => {
    const matchCat = selectedCat === 'all' || e.category_id === selectedCat || e.category_slug === selectedCat;
    const matchSearch = !search.trim() ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>{t('Centralized Examination Directory', 'केंद्रीकृत परीक्षा निर्देशिका')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Explore Competitive Examinations', 'प्रतियोगी परीक्षाएं खोजें')}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t(
              'Browse all 21+ competitive examinations across Bihar State and All-India national level with complete syllabus breakdowns, patterns, and mock tests.',
              'बिहार राज्य और अखिल भारतीय स्तर की सभी 21+ प्रतियोगी परीक्षाओं का विस्तृत पाठ्यक्रम, परीक्षा पैटर्न और मॉक टेस्ट देखें।'
            )}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search by exam name or conducting body...', 'परीक्षा या आयोग के नाम से खोजें...')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2 rounded-xl transition-colors shrink-0 ${
              selectedCat === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Categories ({exams.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-2 rounded-xl transition-colors shrink-0 ${
                selectedCat === c.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name} ({c.exam_count || 0})
            </button>
          ))}
        </div>

        {/* Examinations Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading examination catalogue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">No examinations found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing your search query or selecting another category.</p>
            <button
              onClick={() => { setSelectedCat('all'); setSearch(''); }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(exam => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-400/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {exam.category_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {exam.frequency || 'Annual'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {exam.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    {exam.full_name}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {exam.description}
                  </p>

                  {exam.conducting_body && (
                    <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-700">Conducting Body:</span> {exam.conducting_body}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span>{exam.test_count || 3} Tests</span>
                    <span>•</span>
                    <span>{exam.material_count || 4} Notes</span>
                  </div>

                  <button
                    onClick={() => onNavigate('exam-detail', exam.slug)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>{t('View Syllabus & Tests', 'पाठ्यक्रम व टेस्ट देखें')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
