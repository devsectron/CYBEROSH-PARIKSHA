import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Examination, ExamCategory, MockTest, StudyMaterial, ModelPaper } from '../types';
import { PlatformBackground } from '../components/PlatformBackground';
import {
  GraduationCap,
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle,
  Clock,
  Flame,
  FileText,
  ShieldCheck,
  TrendingUp,
  Download,
  Play,
  Users,
  Star,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, t } = useAuth();

  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [popularExams, setPopularExams] = useState<Examination[]>([]);
  const [demoTests, setDemoTests] = useState<MockTest[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [papers, setPapers] = useState<ModelPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [catRes, examRes, testRes, matRes, paperRes] = await Promise.all([
          api.exams.getCategories(),
          api.exams.getExams({ featured: true }),
          api.tests.getTests({ free_only: true }),
          api.content.getMaterials(),
          api.content.getPapers()
        ]);

        if (catRes.success) setCategories(catRes.categories || []);
        if (examRes.success) setPopularExams(examRes.exams || []);
        if (testRes.success) setDemoTests(testRes.tests || []);
        if (matRes.success) setMaterials(matRes.materials || []);
        if (paperRes.success) setPapers(paperRes.papers || []);
      } catch (err) {
        console.warn('Home data load notice:', err);
      }
    }

    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('exams', searchQuery.trim());
    }
  };

  const filteredExams = activeCategorySlug === 'all'
    ? popularExams
    : popularExams.filter(e => e.category_slug === activeCategorySlug);

  const faqs = [
    {
      q: t('What makes CYBEROSH PARIKSHA different from other test portals?', 'साइबरोश परीक्षा अन्य टेस्ट पोर्टलों से किस प्रकार भिन्न है?'),
      a: t(
        'CYBEROSH PARIKSHA features an authentic server-authoritative CBT engine matching the exact interface and marking schemes of NTA, BSEB and TCS-iON. Answers are saved safely on the server and scores include true negative-marking penalties and authentic rank benchmarking.',
        'साइबरोश परीक्षा में NTA, BSEB और TCS-iON के वास्तविक इंटरफ़ेस और मार्किंग स्कीम के समान सर्वर-प्रमाणित CBT इंजन है। उत्तर सर्वर पर सुरक्षित रहते हैं और वास्तविक निगेटिव मार्किंग के साथ प्रामाणिक रैंकिंग प्राप्त होती है।'
      )
    },
    {
      q: t('Are questions available in both Hindi and English?', 'क्या प्रश्न हिंदी और अंग्रेजी दोनों भाषाओं में उपलब्ध हैं?'),
      a: t(
        'Yes! Every examination, mock test, and solution provides real-time bilingual toggling between Hindi and English with complete pedagogical explanations.',
        'हाँ! प्रत्येक परीक्षा, मॉक टेस्ट और समाधान में हिंदी और अंग्रेजी के बीच त्वरित भाषा बदलने की सुविधा पूर्ण विस्तृत समाधान के साथ उपलब्ध है।'
      )
    },
    {
      q: t('Can I attempt free mock tests before purchasing a preparation pass?', 'क्या मैं पास खरीदने से पहले फ्री मॉक टेस्ट दे सकता हूँ?'),
      a: t(
        'Absolutely. We offer full-length free demo CBT tests for Bihar STET, BPSC CCE, JEE Main, RRB NTPC, and Banking without requiring payment information.',
        'बिल्कुल! हम बिहार STET, BPSC CCE, JEE Main, RRB NTPC और बैंकिंग के लिए बिना किसी भुगतान के पूर्ण निःशुल्क डेमो टेस्ट प्रदान करते हैं।'
      )
    },
    {
      q: t('How does the preparation pass work for Bihar examinations?', 'बिहार परीक्षाओं के लिए तैयारी पास कैसे काम करता है?'),
      a: t(
        'The Bihar State Pariksha Pass unlocks unlimited mock tests, previous year papers, and premium notes for Bihar STET (Paper 1 & 2), BPSC TRE 4.0, BPSC 71st Prelims, and Bihar Police Constable.',
        'बिहार राज्य परीक्षा पास से बिहार STET, BPSC TRE 4.0, BPSC 71वीं और बिहार पुलिस कांस्टेबल के सभी टेस्ट, पुराने पेपर व नोट्स अनलॉक हो जाते हैं।'
      )
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* 1. HERO SECTION WITH PLATFORM BACKGROUND & MOTIFS */}
      <PlatformBackground initialTheme="cbt-hall" showSelector={true} className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-xs font-semibold text-amber-300 backdrop-blur-md mb-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('All-India & Bihar Competitive Examination Platform', 'अखिल भारतीय व बिहार प्रतियोगी परीक्षा तैयारी मंच')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            {t('Your Preparation. Your Platform.', 'आपकी तैयारी। आपका मंच।')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              {t('Your Success.', 'आपकी सफलता।')}
            </span>
          </h1>

          <p className="text-slate-200 text-sm sm:text-lg max-w-3xl mx-auto leading-relaxed drop-shadow">
            {t(
              'Prepare for Bihar STET, BPSC TRE 4.0, BPSC 71st, JEE Main, NEET UG, Banking, Railway and SSC with quality study materials, topic questions and authentic online CBT mock tests.',
              'बिहार STET, BPSC TRE 4.0, BPSC 71वीं, JEE Main, NEET UG, बैंकिंग, रेलवे और SSC की तैयारी करें गुणवत्तापूर्ण अध्ययन सामग्री, अभ्यास प्रश्न और प्रामाणिक ऑनलाइन CBT मॉक टेस्ट के साथ।'
            )}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center shadow-2xl">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('Search exams, e.g. "Bihar STET", "BPSC TRE", "JEE Main", "RRB NTPC"...', 'परीक्षा खोजें, जैसे "Bihar STET", "BPSC TRE", "NEET"...')}
                className="w-full pl-12 pr-32 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all backdrop-blur-xl"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
              >
                {t('Search', 'खोजें')}
              </button>
            </div>
          </form>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('mock-tests')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>{t('Explore Mock Tests (CBT)', 'मॉक टेस्ट देखें (CBT)')}</span>
              <Play className="w-4 h-4 fill-slate-950" />
            </button>

            <button
              onClick={() => onNavigate('materials')}
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all backdrop-blur-md flex items-center gap-2 hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{t('Browse Study Library', 'अध्ययन लाइब्रेरी')}</span>
            </button>
          </div>

          {/* Trust Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto border-t border-slate-800/80 text-left text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">100% NTA Pattern</span>
                <span className="text-slate-400 text-[11px]">Server-timed CBT</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">21+ Examinations</span>
                <span className="text-slate-400 text-[11px]">Bihar & All-India</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">Bilingual English/हिंदी</span>
                <span className="text-slate-400 text-[11px]">Real-time switch</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">Negative Marks</span>
                <span className="text-slate-400 text-[11px]">Accurate Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </PlatformBackground>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
        {/* 2. POPULAR EXAMINATIONS CATALOG */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>{t('Comprehensive Catalogue', 'विस्तृत परीक्षा सूची')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('Popular Examinations', 'लोकप्रिय परीक्षाएं')}
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full text-xs font-semibold">
              <button
                onClick={() => setActiveCategorySlug('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeCategorySlug === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {categories.slice(0, 5).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategorySlug(cat.slug)}
                  className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                    activeCategorySlug === cat.slug
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.slice(0, 6).map(exam => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400/60 transition-all p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                      {exam.category_name || 'Competitive'}
                    </span>
                    {exam.is_featured === 1 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <Sparkles className="w-3.5 h-3.5" />
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {exam.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    {exam.full_name}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                    {exam.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span>{exam.test_count || 3} Tests</span>
                    <span>•</span>
                    <span>{exam.material_count || 5} Notes</span>
                  </div>

                  <button
                    onClick={() => onNavigate('exam-detail', exam.slug)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>{t('View Exam', 'विवरण देखें')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('exams')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-colors"
            >
              <span>{t('View All 21+ Examinations & Syllabus', 'सभी 21+ परीक्षाएं और पाठ्यक्रम देखें')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 3. FREE DEMO CBT MOCK TESTS */}
        <section className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-blue-900/60">
          <div className="max-w-4xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('100% Free Practice Engine', 'पूर्णतः निःशुल्क अभ्यास इंजन')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('Experience Official CBT Mock Tests', 'वास्तविक CBT मॉक टेस्ट का अनुभव करें')}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              {t(
                'Test your real-time speed, accuracy, and negative marking tolerance in an interface simulating NTA & TCS-iON.',
                'NTA और TCS-iON के समान इंटरफेस में अपनी गति, सटीकता और निगेटिव मार्किंग सहनशीलता की वास्तविक जांच करें।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {demoTests.slice(0, 3).map(test => (
              <div
                key={test.id}
                className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Free Demo
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{test.exam_name}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">
                    {test.title}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-700/60 text-center text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('Duration', 'समय')}</span>
                      <span className="font-bold text-white">{test.duration_minutes}m</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('Questions', 'प्रश्न')}</span>
                      <span className="font-bold text-white">{test.total_questions}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('Negative', 'निगेटिव')}</span>
                      <span className="font-bold text-rose-400">-{test.negative_marking}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('attempt-test', test.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{t('Start Test Now', 'अभी टेस्ट शुरू करें')}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. DIGITAL STUDY LIBRARY HIGHLIGHT */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                PARIKSHA LIBRARY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('High-Yield Study Notes & Guides', 'डिजिटल अध्ययन सामग्री व नोट्स')}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{t('View All Notes', 'सभी नोट्स')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.slice(0, 3).map(mat => (
              <div
                key={mat.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {mat.exam_name || 'Competitive'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{mat.file_size_mb} MB PDF</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {mat.description}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    By: {mat.author}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {mat.downloads_count} {t('downloads', 'डाउनलोड्स')}
                  </span>
                  <button
                    onClick={() => onNavigate('materials')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('Read & Download', 'पढ़ें व डाउनलोड')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. PREVIOUS YEAR QUESTION PAPERS (PYQ) WITH CBT BLUEPRINT TEXTURE */}
        <section className="relative overflow-hidden bg-slate-900 bg-cbt-grid-dark rounded-3xl p-6 sm:p-10 text-white border border-slate-800 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  PARIKSHA PAPERS
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {t('Previous Year Solved Papers & Model Sets', 'पिछले वर्षों के हल प्रश्नपत्र व मॉडल सेट')}
                </h2>
              </div>
              <button
                onClick={() => onNavigate('papers')}
                className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-colors backdrop-blur-sm"
              >
                {t('Browse All Papers', 'सभी पेपर देखें')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.slice(0, 4).map(paper => (
                <div
                  key={paper.id}
                  className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-amber-400">
                          Year {paper.year}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{paper.exam_name}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                        {paper.paper_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {paper.total_questions} Questions • {paper.duration_minutes} Mins • With Answer Key
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('papers')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
                  >
                    {t('View Paper', 'देखें')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. DAILY QUIZ MOTIVATION CARD WITH OMR BUBBLE PATTERN */}
        <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-300">
          <div className="absolute inset-0 bg-omr-pattern opacity-40 pointer-events-none" />
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/10 text-slate-950 text-xs font-extrabold mb-1">
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>{t('Daily Revision Challenge', 'दैनिक अभ्यास चुनौती')}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('Sharpen Your Preparation with Today’s Quiz', 'आज के दैनिक क्विज़ से अपनी तैयारी परखें')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-900 font-medium max-w-xl">
              {t(
                '10 hand-picked questions covering General Studies, Bihar Special, Science, and Reasoning with immediate score reports.',
                'सामान्य अध्ययन, बिहार स्पेशल, विज्ञान व तर्कशक्ति के 10 चयनित प्रश्न तुरंत परिणाम और व्याख्या के साथ।'
              )}
            </p>
          </div>

          <button
            onClick={() => onNavigate('daily-quiz')}
            className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm shadow-xl transition-transform hover:scale-105 shrink-0"
          >
            {t('Take Today’s Quiz (15 Mins)', 'आज का क्विज़ हल करें')}
          </button>
        </section>

        {/* 7. FAQ ACCORDION */}
        <section className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              {t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('Everything You Need to Know', 'परीक्षा तैयारी से जुड़ी आवश्यक जानकारी')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-90 text-amber-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
