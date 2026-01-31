import React from 'react';
import { TrendItem } from '../types';
import { TrendingUpIcon, SparklesIcon, ExternalLinkIcon } from './Icons';

interface Props {
  trend: TrendItem;
  rank: number;
  onClick: (trend: TrendItem) => void;
}

export const TrendCard: React.FC<Props> = ({ trend, rank, onClick }) => {
  const description = trend.description?.replace(/<[^>]+>/g, '').trim();
  const hasDescription = description && description.length > 5;
  const hasNews = trend.newsItems && trend.newsItems.length > 0;

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={() => onClick(trend)}
      className="group relative bg-surface hover:bg-slate-700/80 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-slate-800 hover:border-slate-600 shadow-lg hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image Background */}
      <div className="aspect-video w-full overflow-hidden relative shrink-0">
        <img 
          src={trend.imageUrl} 
          alt={trend.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
        
        {/* Rank Badge */}
        <div className="absolute top-2 left-2 w-9 h-9 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg z-10">
            <span className="font-bold text-white text-base">{rank}</span>
        </div>
      </div>

      <div className="p-5 relative flex flex-col flex-grow">
        {/* Decorative Sparkle */}
        <div className="absolute top-5 right-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <SparklesIcon className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-1 group-hover:text-primary transition-colors">
          {trend.title}
        </h3>
        
        {/* Meta Info - Enhanced Visibility */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm md:text-base text-slate-400 mb-4 bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-1.5 text-green-400">
                <TrendingUpIcon className="w-4 h-4" />
                <span className="font-bold">{trend.approx_traffic || "Hot"}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="font-medium text-slate-200">
                {new Date(trend.pubDate).toLocaleDateString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute:'2-digit' 
                })}
            </span>
        </div>

        <div className="flex-grow">
          {hasDescription && (
            <p className="text-base text-slate-300 line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity mb-4">
               {description}
            </p>
          )}

          {!hasDescription && !hasNews && (
             <p className="text-base text-slate-500 italic">내용 없음</p>
          )}

          {/* News Links List */}
          {hasNews && (
            <div className={`space-y-3 ${hasDescription ? 'border-t border-slate-700/50 pt-3' : ''}`}>
              {trend.newsItems!.slice(0, 3).map((news, idx) => (
                <a 
                  key={idx}
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="flex flex-col group/link p-2 -mx-2 rounded hover:bg-slate-600/30 transition-colors"
                >
                   <div className="flex items-start justify-between gap-2">
                     <span className="text-sm md:text-[15px] text-slate-200 font-medium line-clamp-1 group-hover/link:text-primary transition-colors">
                       {news.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                     </span>
                     <ExternalLinkIcon className="w-4 h-4 text-slate-500 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                   </div>
                   <span className="text-xs text-secondary/80 mt-0.5">
                     {news.source}
                   </span>
                </a>
              ))}
              {trend.newsItems!.length > 3 && (
                 <p className="text-xs text-slate-500 text-right font-medium">+{trend.newsItems!.length - 3} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};