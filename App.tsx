import React, { useState, useEffect } from 'react';
import { toJpeg } from 'html-to-image';
import { fetchTrends } from './services/rssService';
import { translateTrendsToKorean, generateBlogPost } from './services/geminiService';
import { TrendItem } from './types';
import { TrendCard } from './components/TrendCard';
import { TrendAnalysisModal } from './components/TrendAnalysisModal';
import { BlogPostModal } from './components/BlogPostModal';
import { Loader } from './components/Loader';
import { RefreshIcon, SparklesIcon, ExternalLinkIcon, PencilIcon, CameraIcon } from './components/Icons';
import AdSense from './components/AdSense';

type LanguageMode = 'KO' | 'EN';

// Comprehensive list of Google Trends supported countries
const COUNTRIES = [
  // Pinned
  { code: 'KR', name: 'South Korea', nameKO: '대한민국', flag: '🇰🇷' },
  { code: 'US', name: 'United States', nameKO: '미국', flag: '🇺🇸' },

  // Sorted by Korean Name (가나다순)
  { code: 'GR', name: 'Greece', nameKO: '그리스', flag: '🇬🇷' },
  { code: 'ZA', name: 'South Africa', nameKO: '남아프리카공화국', flag: '🇿🇦' },
  { code: 'NL', name: 'Netherlands', nameKO: '네덜란드', flag: '🇳🇱' },
  { code: 'NO', name: 'Norway', nameKO: '노르웨이', flag: '🇳🇴' },
  { code: 'NZ', name: 'New Zealand', nameKO: '뉴질랜드', flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria', nameKO: '나이지리아', flag: '🇳🇬' },
  { code: 'TW', name: 'Taiwan', nameKO: '대만', flag: '🇹🇼' },
  { code: 'DK', name: 'Denmark', nameKO: '덴마크', flag: '🇩🇰' },
  { code: 'DE', name: 'Germany', nameKO: '독일', flag: '🇩🇪' },
  { code: 'RU', name: 'Russia', nameKO: '러시아', flag: '🇷🇺' },
  { code: 'RO', name: 'Romania', nameKO: '루마니아', flag: '🇷🇴' },
  { code: 'MY', name: 'Malaysia', nameKO: '말레이시아', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', nameKO: '멕시코', flag: '🇲🇽' },
  { code: 'VN', name: 'Vietnam', nameKO: '베트남', flag: '🇻🇳' },
  { code: 'BE', name: 'Belgium', nameKO: '벨기에', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', nameKO: '브라질', flag: '🇧🇷' },
  { code: 'SA', name: 'Saudi Arabia', nameKO: '사우디아라비아', flag: '🇸🇦' },
  { code: 'SE', name: 'Sweden', nameKO: '스웨덴', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', nameKO: '스위스', flag: '🇨🇭' },
  { code: 'ES', name: 'Spain', nameKO: '스페인', flag: '🇪🇸' },
  { code: 'SG', name: 'Singapore', nameKO: '싱가포르', flag: '🇸🇬' },
  { code: 'AR', name: 'Argentina', nameKO: '아르헨티나', flag: '🇦🇷' },
  { code: 'IE', name: 'Ireland', nameKO: '아일랜드', flag: '🇮🇪' },
  { code: 'GB', name: 'United Kingdom', nameKO: '영국', flag: '🇬🇧' },
  { code: 'AT', name: 'Austria', nameKO: '오스트리아', flag: '🇦🇹' },
  { code: 'UA', name: 'Ukraine', nameKO: '우크라이나', flag: '🇺🇦' },
  { code: 'IL', name: 'Israel', nameKO: '이스라엘', flag: '🇮🇱' },
  { code: 'EG', name: 'Egypt', nameKO: '이집트', flag: '🇪🇬' },
  { code: 'IT', name: 'Italy', nameKO: '이탈리아', flag: '🇮🇹' },
  { code: 'IN', name: 'India', nameKO: '인도', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', nameKO: '인도네시아', flag: '🇮🇩' },
  { code: 'JP', name: 'Japan', nameKO: '일본', flag: '🇯🇵' },
  { code: 'CZ', name: 'Czechia', nameKO: '체코', flag: '🇨🇿' },
  { code: 'CL', name: 'Chile', nameKO: '칠레', flag: '🇨🇱' },
  { code: 'CA', name: 'Canada', nameKO: '캐나다', flag: '🇨🇦' },
  { code: 'KE', name: 'Kenya', nameKO: '케냐', flag: '🇰🇪' },
  { code: 'CO', name: 'Colombia', nameKO: '콜롬비아', flag: '🇨🇴' },
  { code: 'TH', name: 'Thailand', nameKO: '태국', flag: '🇹🇭' },
  { code: 'TR', name: 'Türkiye', nameKO: '튀르키예', flag: '🇹🇷' },
  { code: 'PE', name: 'Peru', nameKO: '페루', flag: '🇵🇪' },
  { code: 'PT', name: 'Portugal', nameKO: '포르투갈', flag: '🇵🇹' },
  { code: 'PL', name: 'Poland', nameKO: '폴란드', flag: '🇵🇱' },
  { code: 'FR', name: 'France', nameKO: '프랑스', flag: '🇫🇷' },
  { code: 'FI', name: 'Finland', nameKO: '핀란드', flag: '🇫🇮' },
  { code: 'PH', name: 'Philippines', nameKO: '필리핀', flag: '🇵🇭' },
  { code: 'HU', name: 'Hungary', nameKO: '헝가리', flag: '🇭🇺' },
  { code: 'AU', name: 'Australia', nameKO: '호주', flag: '🇦🇺' },
  { code: 'HK', name: 'Hong Kong', nameKO: '홍콩', flag: '🇭🇰' },
];

const App = () => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  // We store the original fetched data to switch back to "Original" view quickly without refetching
  const [originalTrends, setOriginalTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [country, setCountry] = useState<string>('KR');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('KO');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Blog Generation State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState<string | null>(null);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  const getCountryData = (code: string) => COUNTRIES.find(c => c.code === code);
  const getCountryName = (code: string) => {
    const data = getCountryData(code);
    return data ? data.nameKO : code;
  };
  const getCountryFlag = (code: string) => getCountryData(code)?.flag || '';

  const loadTrends = async (targetCountry: string = country, targetMode: LanguageMode = languageMode) => {
    setLoading(true);
    setTrends([]);

    try {
      const data = await fetchTrends(targetCountry);
      setOriginalTrends(data);

      // Logic update: check targetMode instead of state directly for the initial load logic
      // If Country is NOT KR and Mode is KO, we translate.
      if (targetCountry !== 'KR' && targetMode === 'KO') {
        setIsTranslating(true);
        const translatedData = await translateTrendsToKorean(data);
        setTrends(translatedData);
        setIsTranslating(false);
      } else {
        // For KR or Non-KR in Original mode, just use the data
        setTrends(data);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  // Initial Load & Country Change
  useEffect(() => {
    let mode: LanguageMode = languageMode;

    if (country === 'KR') {
      mode = 'KO';
      setLanguageMode('KO');
    } else {
      // Default to Original for any non-KR country
      mode = 'EN';
      setLanguageMode('EN');
    }

    loadTrends(country, mode);
  }, [country]);

  // Handle Language Toggle
  const handleLanguageToggle = async (mode: LanguageMode) => {
    if (mode === languageMode) return;
    setLanguageMode(mode);

    if (country !== 'KR') {
      if (mode === 'EN') {
        // Restore original
        setTrends(originalTrends);
      } else {
        // Switch to Korean
        if (originalTrends.length > 0) {
          setIsTranslating(true);
          const translated = await translateTrendsToKorean(originalTrends);
          setTrends(translated);
          setIsTranslating(false);
        }
      }
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  // Improved Capture Logic using html-to-image
  const captureScreen = async (): Promise<string | null> => {
    try {
      const element = document.getElementById('capture-area');
      if (!element) return null;

      // Ensure fonts are loaded before capture
      await document.fonts.ready;

      // Use html-to-image toJpeg
      // This library handles modern CSS (gradients, backdrop-filter) much better than html2canvas
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#0F172A', // Force dark background to prevent transparency issues
        // We filter nothing out to keep "what you see is what you get"
        // But we can add a filter function if we want to hide specific buttons during capture
      });

      return dataUrl;
    } catch (err) {
      console.error("Capture failed:", err);
      return null;
    }
  };

  const handleScreenshot = async () => {
    if (loading || trends.length === 0) return;
    setIsCapturing(true);

    // Short delay to allow UI to settle (e.g. if keyboard was open or ripple effects)
    await new Promise(resolve => setTimeout(resolve, 300));

    const dataUrl = await captureScreen();
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `AI_Trends_Snapshot_${timestamp}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("화면 캡쳐에 실패했습니다.");
    }
    setIsCapturing(false);
  };

  const handleBlogGeneration = async () => {
    setIsGeneratingBlog(true);

    setIsBlogModalOpen(false);
    setBlogContent('');
    setBlogImage(null);

    // Capture logic
    await new Promise(resolve => setTimeout(resolve, 300));
    const dataUrl = await captureScreen();
    setBlogImage(dataUrl);

    setIsBlogModalOpen(true);

    const content = await generateBlogPost(trends);

    setBlogContent(content);
    setIsGeneratingBlog(false);
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary selection:text-white pb-10">

      {/* Capture Area starts here to include Header */}
      <div id="capture-area" className="bg-dark relative">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-dark/80 backdrop-blur-lg border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-gradient-to-br from-primary to-secondary p-1.5 md:p-2 rounded-lg shadow-lg shadow-primary/20">
                <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-lg md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400 hidden sm:block">
                AI Trends
              </h1>
            </div>

            {/* Controls Container - Optimized for Mobile */}
            <div className="flex items-center gap-1.5 md:gap-4 overflow-x-auto no-scrollbar ml-2 w-full justify-end">
              {/* Country Selector - Reduced min-width for mobile */}
              <div className="relative group shrink-0">
                <select
                  value={country}
                  onChange={handleCountryChange}
                  className="appearance-none bg-slate-800 border border-slate-700 text-white py-1.5 pl-2 pr-7 md:py-2 md:pl-3 md:pr-8 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary hover:bg-slate-700 transition-colors cursor-pointer shadow-sm w-[110px] md:w-auto md:min-w-[180px]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.nameKO}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-white transition-colors">
                  <svg className="fill-current h-3 w-3 md:h-4 md:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>

              {/* Language Toggle */}
              {country !== 'KR' && (
                <div className="flex bg-slate-800 p-0.5 md:p-1 rounded-lg border border-slate-700 shrink-0">
                  <button
                    onClick={() => handleLanguageToggle('EN')}
                    className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${languageMode === 'EN' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Orig
                  </button>
                  <button
                    onClick={() => handleLanguageToggle('KO')}
                    className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${languageMode === 'KO' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    한글
                  </button>
                </div>
              )}

              {/* Action Buttons Group */}
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                {/* Capture Button */}
                <button
                  onClick={handleScreenshot}
                  disabled={loading || trends.length === 0 || isCapturing}
                  className="flex items-center justify-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg hover:shadow-slate-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="화면 캡쳐 저장"
                >
                  <CameraIcon className={`w-4 h-4 md:w-4 md:h-4 ${isCapturing ? 'animate-pulse' : ''}`} />
                  <span className="hidden lg:inline">{isCapturing ? '캡쳐 중...' : '캡쳐'}</span>
                </button>

                {/* Blog Button */}
                <button
                  onClick={handleBlogGeneration}
                  disabled={loading || trends.length === 0}
                  className="flex items-center justify-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PencilIcon className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="hidden lg:inline">Blog 작성</span>
                </button>

                {/* Google Trends Link - Visible Icon on Mobile */}
                <a
                  href={`https://trends.google.com/trending?geo=${country}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Go to Google Trends"
                  className="flex items-center justify-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs md:text-sm font-medium transition-colors border border-slate-700"
                >
                  <span className="hidden lg:inline">Google Trends</span>
                  <ExternalLinkIcon className="w-4 h-4 md:w-4 md:h-4" />
                </a>

                {/* Refresh Button - Always visible icon */}
                <button
                  onClick={() => loadTrends(country)}
                  disabled={loading || isTranslating}
                  className="group flex items-center justify-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
                  title="Refresh"
                >
                  <RefreshIcon className={`w-4 h-4 md:w-5 md:h-5 ${loading || isTranslating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="hidden lg:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Sub-header / Status */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <p className="text-slate-400 font-medium mb-2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Real-time Search Trends
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                What's trending in <br className="hidden md:block" />
                <span className="text-white flex items-center gap-2">
                  {getCountryFlag(country)} {getCountryName(country)}
                </span>
              </h2>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl flex flex-col items-end min-w-[280px]">
              <div className="flex items-center justify-end gap-2 mb-2 w-full border-b border-slate-700/50 pb-2">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Live Feed</span>
                <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></div>
              </div>

              <div className="flex flex-col items-end">
                <p className="text-2xl font-black text-white tracking-tight">
                  {lastUpdated.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                </p>
                <p className="text-xl font-mono font-bold text-primary">
                  {lastUpdated.toLocaleTimeString('ko-KR', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>

              <p className="text-xs text-slate-400 mt-2 text-right">
                Click <span className="font-bold text-white bg-slate-700 px-1 rounded">Refresh</span> for latest updates
              </p>

              {/* Mobile Google Trends Link */}
              <div className="mt-3 md:hidden flex justify-end w-full border-t border-slate-700/50 pt-2">
                <a
                  href={`https://trends.google.com/trending?geo=${country}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                >
                  Visit Google Trends <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <Loader />
              <p className="text-slate-400 animate-pulse">Fetching latest trends...</p>
            </div>
          ) : isTranslating ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-300 font-medium animate-pulse flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-secondary" />
                AI Translating to Korean...
              </p>
              <div className="w-full max-w-md mt-4">
                <AdSense />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trends.map((trend, index) => (
                <TrendCard
                  key={`${trend.title}-${index}`}
                  trend={trend}
                  rank={index + 1}
                  onClick={setSelectedTrend}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Analysis Modal */}
      {selectedTrend && (
        <TrendAnalysisModal
          trend={selectedTrend}
          onClose={() => setSelectedTrend(null)}
        />
      )}

      {/* Blog Post Modal */}
      {isBlogModalOpen && (
        <BlogPostModal
          content={blogContent}
          imageData={blogImage}
          isLoading={isGeneratingBlog}
          onClose={() => setIsBlogModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;