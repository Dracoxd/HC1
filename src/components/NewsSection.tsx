import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { NEWS_UPDATES } from '../data/healthCenterData';
import { NewsUpdate } from '../types';
import { Newspaper, Search, Calendar, User, ArrowRight, X } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { t, language } = useHealthCenter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readingArticle, setReadingArticle] = useState<NewsUpdate | null>(null);

  const categories = ['all', 'Campaign', 'Schedule', 'Advisory', 'Meds'];

  const filteredNews = NEWS_UPDATES.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.titleFil.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.summaryFil.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="news" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Pampublikong Pabatid at Balita' : 'Public Health Advisories'}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              {t.newsTitle}
            </h2>
            <p className="text-sm text-slate-600">
              {t.newsSubtitle}
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.newsSearchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 shadow-2xs"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Updates' : cat}
            </button>
          ))}
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-4">
                {/* Clean unboxed metadata with typographic dot separator */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-teal-800">
                    {language === 'fil' ? news.categoryFil : news.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{news.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{news.readTime}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-950 leading-snug">
                    {language === 'fil' ? news.titleFil : news.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'fil' ? news.summaryFil : news.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {news.author}
                </span>

                <button
                  onClick={() => setReadingArticle(news)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.btnReadArticle}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Full Article Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  {language === 'fil' ? readingArticle.categoryFil : readingArticle.category} · {readingArticle.date}
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {language === 'fil' ? readingArticle.titleFil : readingArticle.title}
                </h3>
                <div className="text-xs text-slate-500">
                  Published by {readingArticle.author} · Mr. Flores Health Center
                </div>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-sm text-slate-700 leading-relaxed text-xs sm:text-sm">
              <p>
                {language === 'fil' ? readingArticle.contentFil : readingArticle.content}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                {t.btnCloseArticle}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
