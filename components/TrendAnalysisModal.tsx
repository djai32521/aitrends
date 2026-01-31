import React, { useEffect, useState, useRef } from 'react';
import { TrendItem, GeminiAnalysisResult } from '../types';
import { analyzeTrendWithGemini } from '../services/geminiService';
import { XIcon, SparklesIcon, ExternalLinkIcon } from './Icons';

interface Props {
  trend: TrendItem | null;
  onClose: () => void;
}

export const TrendAnalysisModal: React.FC<Props> = ({ trend, onClose }) => {
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (trend) {
        setLoading(true);
        setAnalysis(null);
        // Pass the full trend object which now includes newsItems
        const result = await analyzeTrendWithGemini(trend);
        setAnalysis(result);
        setLoading(false);
      }
    };

    if (trend) {
      fetchAnalysis();
    }
  }, [trend]);

  if (!trend) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]"
      >
        {/* Header Image */}
        <div className="relative h-48 md:h-64 bg-slate-900 shrink-0">
          <img 
            src={trend.imageUrl} 
            alt={trend.title} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md leading-tight">
              {trend.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-slate-300 text-sm">
                <span>{trend.source}</span>
                <span>•</span>
                <span>{trend.approx_traffic} searches</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Gemini AI Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 text-secondary font-semibold">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
              <span>Gemini AI 트렌드 분석</span>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group">
                {/* Decorative sheen */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-700 rounded w-full"></div>
                        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                        <div className="flex gap-2 mt-4">
                            <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
                            <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-white">{analysis.reason}</h3>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                            {analysis.summary}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {analysis.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-primary/20 text-primary-200 text-xs font-medium rounded-full border border-primary/20">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-red-400 text-sm">분석을 불러오지 못했습니다.</p>
                )}
            </div>
          </div>

          {/* Related News Section */}
          <div className="mb-6">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-3">관련 뉴스 (RSS)</h3>
            
            {trend.newsItems && trend.newsItems.length > 0 ? (
                <div className="space-y-3">
                    {trend.newsItems.map((news, idx) => (
                        <a 
                            key={idx}
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all group/news"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <h4 className="text-white font-medium text-sm leading-snug group-hover/news:text-primary transition-colors">
                                    {news.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                                </h4>
                                <ExternalLinkIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <span className="text-secondary">{news.source}</span>
                                {news.snippet && (
                                    <>
                                        <span className="text-slate-600">|</span>
                                        <span className="line-clamp-1 opacity-75">{news.snippet}</span>
                                    </>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-sm italic">관련 뉴스 링크가 없습니다.</p>
            )}
          </div>

          <div className="flex justify-center mt-6">
             <a 
                href={trend.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-white underline decoration-slate-700 transition-colors"
             >
                Google Trends 원문 보기
             </a>
          </div>

        </div>
      </div>
    </div>
  );
};