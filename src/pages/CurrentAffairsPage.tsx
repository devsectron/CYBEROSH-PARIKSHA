import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CurrentAffairsItem } from '../types';
import { Sparkles, Calendar, Search, Tag, ExternalLink, Bookmark, Share2 } from 'lucide-react';

interface CurrentAffairsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CurrentAffairsPage: React.FC<CurrentAffairsPageProps> = ({ onNavigate }) => {
  const { t } = useAuth();
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await api.content.getCurrentAffairs();
        if (res.success) {
          setItems(res.current_affairs || []);
        }
      } catch (err) {
        console.warn('Error loading current affairs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = items.filter(item => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>PARIKSHA CURRENT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('Daily Current Affairs & General Knowledge', 'दैनिक करेंट अफेयर्स व सामान्य ज्ञान')}
          </h1>
          <p className="text-sm text-slate-600">
            {t(
              'High-yield national and Bihar special current events with factual citations for BPSC, STET, Banking and SSC.',
              'BPSC, STET, बैंकिंग और SSC के लिए प्रामाणिक स्रोतों से सत्यापित राष्ट्रीय और बिहार विशेष घटनाक्रम।'
            )}
          </p>

          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-4 top-4.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search current affairs topics..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Updates
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Feed */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading current affairs digest...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 text-slate-600 text-xs">
            No current affairs found matching this search.
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map(item => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase tracking-wider text-[10px]">
                      {item.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {item.source && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Source: {item.source}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.summary}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
