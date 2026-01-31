import React, { useEffect, useRef, useState } from 'react';
import { XIcon, ClipboardIcon, SparklesIcon } from './Icons';

interface Props {
  content: string;
  imageData: string | null;
  onClose: () => void;
  isLoading: boolean;
}

export const BlogPostModal: React.FC<Props> = ({ content, imageData, onClose, isLoading }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopyText = async () => {
    try {
      // Replace placeholder with instructions for Tistory user
      const textToCopy = content.replace(
        '![Today\'s Trends]({{SCREENSHOT_PLACEHOLDER}})', 
        '\n\n[여기에 다운로드한 스크린샷 이미지를 업로드해주세요]\n\n'
      );
      
      await navigator.clipboard.writeText(textToCopy);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert("복사에 실패했습니다.");
    }
  };

  const handleDownloadImage = () => {
      if (!imageData) return;
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `Trend_Snapshot_${new Date().toISOString().slice(0,10)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-surface w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 shrink-0">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-1.5 rounded-lg">
                    <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">블로그 포스팅 생성 완료</h2>
                    <p className="text-xs text-slate-400">마크다운(Markdown) 형식으로 작성되었습니다.</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-900">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-white h-full w-full">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-white animate-pulse">콘텐츠 생성 중...</h3>
                        <p className="text-slate-400">화면 캡쳐 및 AI 글쓰기를 진행하고 있습니다.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* Image Preview Section */}
                    {imageData && (
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                             <div className="flex justify-between items-center mb-3">
                                 <h3 className="text-sm font-bold text-slate-300">📸 캡쳐된 화면 (메인 이미지용)</h3>
                                 <button 
                                    onClick={handleDownloadImage}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors font-medium flex items-center gap-1"
                                 >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                     이미지 다운로드
                                 </button>
                             </div>
                             <img src={imageData} alt="Dashboard Screenshot" className="w-full rounded-lg shadow-lg border border-slate-600" />
                         </div>
                    )}

                    {/* Markdown Content Section */}
                    <div className="bg-white text-slate-900 p-6 rounded-xl shadow-lg font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-300">
                        {content}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3 shrink-0">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-300 font-medium hover:text-white transition-colors text-sm"
                >
                    닫기
                </button>
                
                <button 
                    onClick={handleCopyText}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-lg text-sm ${
                        copied 
                        ? 'bg-green-500 text-white shadow-green-500/25' 
                        : 'bg-primary hover:bg-primary/90 text-white shadow-primary/25 hover:-translate-y-0.5'
                    }`}
                >
                    {copied ? (
                        <>
                            <span>텍스트 복사 완료!</span>
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            <span>본문 복사 (Markdown)</span>
                        </>
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};